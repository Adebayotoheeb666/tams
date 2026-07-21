"use server";

import { auth } from "@/auth";
import { ACCOUNT_CODES } from "@/lib/accounting/accounts";
import { db } from "@/lib/db";
import {
  accounts,
  appointments,
  broadcastListMembers,
  journalEntries,
  journalEntryLines,
  services,
  type Appointment,
  type Service,
} from "@/lib/db/schema";
import { triggerClient } from "@/trigger/client";
import {
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
} from "@/lib/validations/appointments";
import { addMinutesToTime, nowIso, todayDateString } from "@/lib/utils";
import {
  buildAppointmentMessage,
  getAppointmentMarketingSegment,
  normalizeWhatsappNumber,
} from "@/lib/utils/marketing/appointment-marketing";
import { and, asc, count, eq, gte, inArray, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isPeriodLocked } from "@/lib/actions/bookkeeping";
import { forwardToN8nWebhook } from "@/lib/integrations/n8n";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireAppointmentAccess() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role === "accountant") throw new Error("Forbidden");
  return session;
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

async function nextJournalEntryNumber(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
  const [{ value }] = await tx.select({ value: count() }).from(journalEntries);
  return `JE-${String(Number(value) + 1).padStart(4, "0")}`;
}

async function recordServiceRevenue(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  appointmentId: string,
  amount: number,
  label: string,
  userId: string,
) {
  const accountRows = await tx.query.accounts.findMany({
    where: inArray(accounts.code, [ACCOUNT_CODES.CASH, ACCOUNT_CODES.NAIL_REVENUE]),
  });
  const accountMap = new Map(accountRows.map((row) => [row.code, row.id]));
  const cashId = accountMap.get(ACCOUNT_CODES.CASH);
  const revenueId = accountMap.get(ACCOUNT_CODES.NAIL_REVENUE);
  if (!cashId || !revenueId) {
    throw new Error("Required accounts not found. Run db:seed.");
  }

  const journalEntryId = crypto.randomUUID();
  const now = nowIso();

  await tx.insert(journalEntries).values({
    id: journalEntryId,
    entryNumber: await nextJournalEntryNumber(tx),
    entryDate: todayDateString(),
    description: label,
    referenceType: "sale",
    referenceId: appointmentId,
    isReversed: 0,
    createdBy: userId,
    createdAt: now,
  });

  await tx.insert(journalEntryLines).values([
    {
      id: crypto.randomUUID(),
      journalEntryId,
      accountId: cashId,
      entryType: "debit",
      amount,
      description: label,
    },
    {
      id: crypto.randomUUID(),
      journalEntryId,
      accountId: revenueId,
      entryType: "credit",
      amount,
      description: label,
    },
  ]);
}

async function enrollAppointmentMarketingContact(input: {
  customerName: string;
  customerPhone: string;
  priceNaira?: number;
}) {
  const normalizedPhone = normalizeWhatsappNumber(input.customerPhone);
  if (!normalizedPhone) return;

  const segment = getAppointmentMarketingSegment(input.priceNaira);
  const existing = await db.query.broadcastListMembers.findFirst({
    where: eq(broadcastListMembers.whatsappNumber, normalizedPhone),
  });

  const now = nowIso();
  const values = {
    id: existing?.id || crypto.randomUUID(),
    customerId: null,
    whatsappNumber: normalizedPhone,
    firstName: input.customerName || null,
    segment,
    status: "active" as const,
    consentGiven: 1,
    consentDate: now,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (existing) {
    await db.update(broadcastListMembers).set(values).where(eq(broadcastListMembers.id, existing.id));
    return;
  }

  await db.insert(broadcastListMembers).values(values as any);
}

async function sendAppointmentMarketingMessage(input: {
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  type: "confirmation" | "reminder";
}) {
  const normalizedPhone = normalizeWhatsappNumber(input.customerPhone);
  if (!normalizedPhone) return;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!sid || !token || !from) {
    console.log("Twilio not configured; skipping appointment marketing message.");
    return;
  }

  const message = buildAppointmentMessage(input.type, {
    customerName: input.customerName,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    serviceName: input.serviceName,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${normalizedPhone}`,
    Body: message,
  });

  const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Twilio rejected the appointment message with status ${response.status}`);
  }
}

export async function getServices(): Promise<Service[]> {
  await requireAppointmentAccess();
  return db.query.services.findMany({
    where: eq(services.isActive, 1),
    orderBy: [asc(services.name)],
  });
}

export type AppointmentWithService = Appointment & {
  service: { id: string; name: string; durationMinutes: number };
};

export async function getAppointments(filters?: {
  from?: string;
  to?: string;
  status?: Appointment["status"];
}) {
  await requireAppointmentAccess();

  const from = filters?.from ?? todayDateString();
  const to =
    filters?.to ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const conditions = [
    gte(appointments.appointmentDate, from),
    lte(appointments.appointmentDate, to),
  ];

  if (filters?.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  return db.query.appointments.findMany({
    where: and(...conditions),
    with: { service: true },
    orderBy: [asc(appointments.appointmentDate), asc(appointments.startTime)],
  });
}

export async function bookAppointment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAppointmentAccess();

  const parsed = bookAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid appointment data",
    };
  }

  const data = parsed.data;
  const service = await db.query.services.findFirst({
    where: and(eq(services.id, data.serviceId), eq(services.isActive, 1)),
  });

  if (!service) {
    return { success: false, error: "Service not found" };
  }

  const endTime = addMinutesToTime(data.startTime, service.durationMinutes);
  const priceCharged = data.priceNaira
    ? Math.round(data.priceNaira * 100)
    : service.price;

  const sameDay = await db.query.appointments.findMany({
    where: and(
      eq(appointments.appointmentDate, data.appointmentDate),
      inArray(appointments.status, ["booked", "confirmed", "in_progress"]),
    ),
  });

  for (const existing of sameDay) {
    if (timesOverlap(data.startTime, endTime, existing.startTime, existing.endTime)) {
      return {
        success: false,
        error: `Time slot conflicts with ${existing.customerName} (${existing.startTime}–${existing.endTime})`,
      };
    }
  }

  const id = crypto.randomUUID();
  await db.insert(appointments).values({
    id,
    customerId: null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    serviceId: data.serviceId,
    appointmentDate: data.appointmentDate,
    startTime: data.startTime,
    endTime,
    status: "booked",
    priceCharged,
    notes: data.notes || null,
    reminderSent: 0,
    createdAt: nowIso(),
  });

  try {
    await enrollAppointmentMarketingContact({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      priceNaira: priceCharged,
    });

    await sendAppointmentMarketingMessage({
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.startTime,
      serviceName: service.name,
      type: "confirmation",
    });
  } catch (error) {
    console.error("Failed to send appointment confirmation marketing message:", error);
  }

  // Schedule reminder for 24 hours before appointment
  try {
    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.startTime}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();

    if (reminderTime > now) {
      const { TRIGGER_EVENTS } = await import("@/trigger/client");
      await triggerClient.triggerEvent(TRIGGER_EVENTS.APPOINTMENTS_REMINDERS_SEND, {
        appointmentId: id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        serviceName: service.name,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.startTime,
        reminderTime: reminderTime.toISOString(),
      });
    }
  } catch (error) {
    console.error("Failed to schedule appointment reminder:", error);
  }

  try {
    await forwardToN8nWebhook(process.env.N8N_APPOINTMENT_PATH ?? "/webhook/appointment-booked", {
      event: "appointment.booked",
      appointment: {
        id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        serviceId: data.serviceId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        status: "booked",
        notes: data.notes || null,
      },
    });
  } catch (error) {
    console.error("Failed to forward appointment booking to n8n:", error);
  }

  revalidatePath("/appointments");
  revalidatePath("/");

  return { success: true, data: { id } };
}

export async function updateAppointmentStatus(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAppointmentAccess();

  const parsed = updateAppointmentStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status update",
    };
  }

  const { appointmentId, status } = parsed.data;
  const appointment = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    with: { service: true },
  });

  if (!appointment) {
    return { success: false, error: "Appointment not found" };
  }

  if (appointment.status === "completed" && status !== "completed") {
    return { success: false, error: "Completed appointments cannot be changed" };
  }

  if (status === "completed" && appointment.status !== "completed") {
    if (await isPeriodLocked(todayDateString())) {
      return { success: false, error: "Accounting period is locked" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(appointments)
        .set({ status })
        .where(eq(appointments.id, appointmentId));

      await recordServiceRevenue(
        tx,
        appointmentId,
        appointment.priceCharged,
        `Nail service — ${appointment.service.name} (${appointment.customerName})`,
        session.user.id,
      );
    });
  } else {
    await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, appointmentId));

    // Trigger reminder when confirmed
    if (status === "confirmed") {
      try {
        const appointmentDateTime = new Date(
          `${appointment.appointmentDate}T${appointment.startTime}`
        );
        const reminderTime = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
        const now = new Date();

        if (reminderTime > now) {
          const { TRIGGER_EVENTS } = await import("@/trigger/client");
          await triggerClient.triggerEvent(TRIGGER_EVENTS.APPOINTMENTS_CONFIRMATIONS_SEND, {
            appointmentId,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            serviceName: appointment.service.name,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.startTime,
            reminderTime: reminderTime.toISOString(),
          });
        }

        await enrollAppointmentMarketingContact({
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          priceNaira: appointment.priceCharged,
        });

        await sendAppointmentMarketingMessage({
          customerName: appointment.customerName,
          customerPhone: appointment.customerPhone,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.startTime,
          serviceName: appointment.service.name,
          type: "confirmation",
        });
      } catch (error) {
        console.error("Failed to trigger confirmation reminder:", error);
      }

      try {
        await forwardToN8nWebhook(process.env.N8N_APPOINTMENT_PATH ?? "/webhook/appointment-booked", {
          event: "appointment.confirmed",
          appointment: {
            id: appointmentId,
            customerName: appointment.customerName,
            customerPhone: appointment.customerPhone,
            serviceId: appointment.serviceId,
            appointmentDate: appointment.appointmentDate,
            startTime: appointment.startTime,
            status: "confirmed",
            notes: appointment.notes,
          },
        });
      } catch (error) {
        console.error("Failed to forward appointment confirmation to n8n:", error);
      }
    }
  }

  revalidatePath("/appointments");
  revalidatePath("/bookkeeping/ledger");
  revalidatePath("/");

  return { success: true, data: { id: appointmentId } };
}

export async function getUpcomingAppointments(limit = 5) {
  await requireAppointmentAccess();
  const today = todayDateString();

  return db.query.appointments.findMany({
    where: and(
      gte(appointments.appointmentDate, today),
      inArray(appointments.status, ["booked", "confirmed", "in_progress"]),
    ),
    with: { service: true },
    orderBy: [asc(appointments.appointmentDate), asc(appointments.startTime)],
    limit,
  });
}

async function requireOwnerAccess() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "owner") throw new Error("Forbidden");
  return session;
}

export async function getAllServices(): Promise<Service[]> {
  await requireOwnerAccess();
  return db.query.services.findMany({
    orderBy: [asc(services.name)],
  });
}

export async function createService(input: {
  name: string;
  durationMinutes: number;
  price: number;
  materialsConsumed?: string;
}): Promise<ActionResult<Service>> {
  await requireOwnerAccess();

  const { name, durationMinutes, price, materialsConsumed } = input;

  if (!name.trim()) {
    return { success: false, error: "Service name is required" };
  }

  if (durationMinutes <= 0) {
    return { success: false, error: "Duration must be greater than 0" };
  }

  if (price < 0) {
    return { success: false, error: "Price cannot be negative" };
  }

  const id = crypto.randomUUID();
  await db.insert(services).values({
    id,
    name: name.trim(),
    durationMinutes,
    price,
    materialsConsumed: materialsConsumed?.trim() || null,
    isActive: 1,
    createdAt: nowIso(),
  });

  revalidatePath("/services");

  const newService = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!newService) {
    return { success: false, error: "Failed to create service" };
  }

  return { success: true, data: newService };
}

export async function updateService(
  id: string,
  input: {
    name: string;
    durationMinutes: number;
    price: number;
    materialsConsumed?: string;
  },
): Promise<ActionResult<Service>> {
  await requireOwnerAccess();

  const { name, durationMinutes, price, materialsConsumed } = input;

  if (!name.trim()) {
    return { success: false, error: "Service name is required" };
  }

  if (durationMinutes <= 0) {
    return { success: false, error: "Duration must be greater than 0" };
  }

  if (price < 0) {
    return { success: false, error: "Price cannot be negative" };
  }

  const existing = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!existing) {
    return { success: false, error: "Service not found" };
  }

  await db
    .update(services)
    .set({
      name: name.trim(),
      durationMinutes,
      price,
      materialsConsumed: materialsConsumed?.trim() || null,
    })
    .where(eq(services.id, id));

  revalidatePath("/services");

  const updated = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!updated) {
    return { success: false, error: "Failed to update service" };
  }

  return { success: true, data: updated };
}

export async function toggleServiceActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult<Service>> {
  await requireOwnerAccess();

  const existing = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!existing) {
    return { success: false, error: "Service not found" };
  }

  await db
    .update(services)
    .set({ isActive: isActive ? 1 : 0 })
    .where(eq(services.id, id));

  revalidatePath("/services");

  const updated = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!updated) {
    return { success: false, error: "Failed to toggle service" };
  }

  return { success: true, data: updated };
}
