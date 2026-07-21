export function normalizeWhatsappNumber(raw: string) {
  const value = (raw || "").trim();

  if (!value) return "";
  if (value.startsWith("whatsapp:")) {
    return value.replace(/^whatsapp:/, "");
  }
  if (value.startsWith("+")) {
    return value;
  }
  if (value.startsWith("0")) {
    return `+234${value.slice(1)}`;
  }

  return value;
}

export function getAppointmentMarketingSegment(priceNaira?: number, hasCustomerId = false) {
  if (typeof priceNaira === "number" && priceNaira >= 20000) {
    return "vip" as const;
  }

  if (hasCustomerId) {
    return "repeat_customer" as const;
  }

  return "new_customer" as const;
}

export function buildAppointmentMessage(
  type: "confirmation" | "reminder",
  payload: {
    customerName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    serviceName?: string;
  },
) {
  const customerName = payload.customerName?.trim() || "there";
  const serviceName = payload.serviceName?.trim() || "your appointment";
  const appointmentDate = payload.appointmentDate || "your scheduled date";
  const appointmentTime = payload.appointmentTime || "your scheduled time";

  if (type === "reminder") {
    return `Hi ${customerName}! Reminder: you have ${serviceName} on ${appointmentDate} at ${appointmentTime}. We look forward to seeing you at Tams Beauty Hub 💖`;
  }

  return `Hi ${customerName}! Your ${serviceName} booking is confirmed for ${appointmentDate} at ${appointmentTime}. We’re excited to see you at Tams Beauty Hub 💖`;
}
