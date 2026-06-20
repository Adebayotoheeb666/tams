import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { journalEntries, journalEntryLines } from "@/lib/db/schema";

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

export async function monthlyStatementsJob() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  const rows = await db
    .select({
      entryType: journalEntryLines.entryType,
      amount: journalEntryLines.amount,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(and(gte(journalEntries.entryDate, firstOfMonth), lte(journalEntries.entryDate, lastOfMonth)));

  const total = rows.reduce((sum, row) => sum + (row.entryType === "debit" ? row.amount : -row.amount), 0);

  await postWebhook(process.env.N8N_MONTHLY_REPORT_PATH ?? "/webhook/monthly-report", {
    periodStart: firstOfMonth,
    periodEnd: lastOfMonth,
    totalChange: total,
    journalLineCount: rows.length,
  });
}
