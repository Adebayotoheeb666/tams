import { db } from "@/lib/db";
import { appointments, automationSettings } from "@/lib/db/schema";
import { buildAppointmentMessage, normalizeWhatsappNumber } from "@/lib/utils/marketing/appointment-marketing";
import { eq } from "drizzle-orm";

function getN8nUrl(path: string) {
  const baseUrl = process.env.N8N_WEBHOOK_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("N8N_WEBHOOK_BASE_URL is not configured");
  }
  return `${baseUrl}${path}`;
}

async function postWebhook(path: string, body: unknown) {
  const url = getN8nUrl(path);
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET ? { "x-n8n-webhook-secret": process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function sendReminderToCustomer(appointment: { customerName: string | null; customerPhone: string | null; appointmentDate: string; startTime: string }) {
  const phone = normalizeWhatsappNumber(appointment.customerPhone || "");
  if (!phone) return;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!sid || !token || !from) {
    return;
  }

  const message = buildAppointmentMessage("reminder", {
    customerName: appointment.customerName || undefined,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.startTime,
    serviceName: "your appointment",
  });

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${phone}`,
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
    throw new Error(`Twilio rejected reminder message with status ${response.status}`);
  }
}

export async function appointmentRemindersJob() {
  // Get reminder time from automation settings (default: 24 hours)
  const reminderSetting = await db.query.automationSettings.findFirst({
    where: eq(automationSettings.key, "appointment_reminder_hours_before"),
  });

  const reminderHours = reminderSetting ? Number(reminderSetting.value) : 24;
  const reminderTime = new Date(Date.now() + reminderHours * 60 * 60 * 1000);
  const reminderDate = reminderTime.toISOString().slice(0, 10);

  const upcoming = await db.query.appointments.findMany({
    where: eq(appointments.appointmentDate, reminderDate),
  });

  if (upcoming.length === 0) {
    return;
  }

  for (const appointment of upcoming) {
    try {
      await sendReminderToCustomer({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
      });
    } catch (error) {
      console.error("Failed to send appointment reminder to customer", error);
    }
  }

  await postWebhook(process.env.N8N_APPOINTMENT_PATH ?? "/webhook/appointment-booked", {
    date: reminderDate,
    reminderHours,
    appointments: upcoming.map((appointment) => ({
      id: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      priceCharged: appointment.priceCharged,
    })),
  });
}
