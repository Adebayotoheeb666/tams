import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { exportJobs } from "@/lib/db/schema";

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "staff") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await db.query.exportJobs.findFirst({ where: eq(exportJobs.id, params.jobId) });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: job.id, status: job.status, fileUrl: job.fileUrl, resultMessage: job.resultMessage });
}
