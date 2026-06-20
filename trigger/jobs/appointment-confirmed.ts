import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";
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

export async function appointmentConfirmedJob(appointmentId: string) {
  const appointment = await db.query.appointments.findFirst({ where: eq(appointments.id, appointmentId) });
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  await postWebhook(process.env.N8N_APPOINTMENT_PATH ?? "/webhook/appointment-booked", {
    appointment: {
      id: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      serviceId: appointment.serviceId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      status: appointment.status,
      notes: appointment.notes,
    },
  });
}
