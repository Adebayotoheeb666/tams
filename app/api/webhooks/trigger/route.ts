import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exportJobs } from "@/lib/db/schema";

export async function POST(request: Request) {
  const secret = process.env.TRIGGER_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-trigger-webhook-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = await request.json().catch(() => null);
  if (!payload || !payload.jobId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { jobId, status, fileUrl, message } = payload;

  await db.update(exportJobs).set({
    status: status ?? "failed",
    fileUrl: fileUrl ?? null,
    resultMessage: message ?? null,
    updatedAt: new Date().toISOString(),
  }).where(exportJobs.id.eq(jobId));

  return NextResponse.json({ ok: true });
}
