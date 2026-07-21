import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "trigger" });
}

export async function POST(request: Request) {
  const payload = await request.text();
  return NextResponse.json({ ok: true, received: payload.length > 0 });
}
