"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { exportJobs } from "@/lib/db/schema";
import { auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { nowIso } from "@/lib/utils";
import { triggerClient } from "@/trigger/client";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function getExportJobs() {
  const session = await requireAuth();
  if (!session) {
    return [];
  }
  return db.query.exportJobs.findMany({ orderBy: [desc(exportJobs.createdAt)] });
}

export async function createExportJob(jobType: string, params: Record<string, unknown>): Promise<ActionResult<{ id: string }>> {
  const session = await requireAuth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const id = crypto.randomUUID();
  const now = nowIso();

  await db.insert(exportJobs).values({
    id,
    jobType,
    params: JSON.stringify(params),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  try {
    await triggerClient.runExport(id);
    await db.update(exportJobs).set({ status: "running", updatedAt: nowIso() }).where(eq(exportJobs.id, id));
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), eventType: "export.requested", userId: null, payload: JSON.stringify({ jobId: id, jobType, params }), ip: null, createdAt: nowIso() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await db.update(exportJobs).set({ status: "failed", resultMessage: message, updatedAt: nowIso() }).where(eq(exportJobs.id, id));
    await db.insert(auditLogs).values({ id: crypto.randomUUID(), eventType: "export.failed", userId: null, payload: JSON.stringify({ jobId: id, error: message }), ip: null, createdAt: nowIso() });
    return { success: false, error: message };
  }

  return { success: true, data: { id } };
}
