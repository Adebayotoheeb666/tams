import { NextResponse } from "next/server";

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

  return NextResponse.json({ ok: true, received: true });
}
