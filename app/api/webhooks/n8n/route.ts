import { NextResponse } from "next/server";
import { forwardToN8nWebhook } from "@/lib/integrations/n8n";

export async function POST(request: Request) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-n8n-webhook-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await forwardToN8nWebhook(process.env.N8N_WEBHOOK_PATH ?? "/webhook/whatsapp-inbound", payload);
    return NextResponse.json({ ok: true, received: true, forwarded: true });
  } catch (error) {
    console.error("Failed to forward webhook payload to n8n", error);
    return NextResponse.json(
      { ok: false, received: true, forwarded: false, error: "Failed to forward payload to n8n" },
      { status: 502 },
    );
  }
}
