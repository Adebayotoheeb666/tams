import { db } from "@/lib/db";
import { and, count, gte, lte } from "drizzle-orm";
import { orders, journalEntries } from "@/lib/db/schema";

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

export async function dailySummaryJob() {
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;
  const sales = await db
    .select({ totalAmount: orders.totalAmount })
    .from(orders)
    .where(and(gte(orders.orderDate, startOfDay), lte(orders.orderDate, endOfDay)));

  const revenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const [{ value: entryCount }] = await db
    .select({ value: count() })
    .from(journalEntries);

  await postWebhook(process.env.N8N_DAILY_SUMMARY_PATH ?? "/webhook/daily-summary", {
    date: today,
    revenue,
    salesCount: sales.length,
    journalEntries: entryCount,
  });
}
