export function buildInboundReply(input: { name?: string; message?: string }) {
  const name = input.name?.trim() || "there";
  const normalizedMessage = (input.message || "").toLowerCase();
  let intro = `Hi ${name}! 💖 Welcome to Tams Beauty Hub — your one-stop for style and glam.`;

  if (normalizedMessage.includes("nail") || normalizedMessage.includes("glitz")) {
    intro += " We can help with nails, press-ons, and maintenance.";
  } else if (normalizedMessage.includes("thrift") || normalizedMessage.includes("shirt") || normalizedMessage.includes("dress")) {
    intro += " We can help with thrift fashion, tops, and statement pieces.";
  } else {
    intro += " Tell us what you need and we will help you right away.";
  }

  return `${intro}\n\nReply with your preferred service or ask for prices.`;
}

export function buildEventMessage(event: string, payload: Record<string, unknown>) {
  switch (event) {
    case "sale": {
      const sale = payload.sale as Record<string, unknown> | undefined;
      const receiptNumber = sale?.receiptNumber ?? "unknown";
      const totalAmount = sale?.totalAmount ?? 0;
      return `New sale received: ${receiptNumber} for ₦${totalAmount}.`;
    }
    case "appointment": {
      const appointment = payload.appointment as Record<string, unknown> | undefined;
      const customerName = appointment?.customerName ?? "a customer";
      return `Appointment update for ${customerName}.`;
    }
    case "low-stock": {
      const product = payload.product as Record<string, unknown> | undefined;
      const name = product?.name ?? "a product";
      return `Low stock alert for ${name}.`;
    }
    default:
      return `Automation event received: ${event}`;
  }
}
