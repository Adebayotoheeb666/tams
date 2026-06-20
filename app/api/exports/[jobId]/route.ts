import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exportJobs } from "@/lib/db/schema";

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const job = await db.query.exportJobs.findFirst({ where: eq(exportJobs.id, params.jobId) });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: job.id, status: job.status, fileUrl: job.fileUrl, resultMessage: job.resultMessage });
}
