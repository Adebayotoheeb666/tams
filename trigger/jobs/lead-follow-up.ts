import { db } from "@/lib/db";
import { leads, automationSettings } from "@/lib/db/schema";
import { eq, lte, and } from "drizzle-orm";

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

export async function leadFollowUpJob() {
  // Query leads with:
  // - status = 'new' or 'contacted'
  // - followUpDate is today or earlier
  // - whatsappNumber exists (can be contacted)

  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];

  const dueLead = await db.query.leads.findMany({
    where: and(
      eq(leads.status, "new"),
      lte(leads.followUpDate, todayIso),
    ),
  });

  if (dueLead.length === 0) {
    return;
  }

  // Send follow-up messages via N8N
  await postWebhook(process.env.N8N_MARKETING_PATH ?? "/webhook/lead-followup", {
    event: "lead.followup",
    leads: dueLead
      .filter((lead) => lead.whatsappNumber)
      .map((lead) => ({
        id: lead.id,
        firstName: lead.firstName,
        whatsappNumber: lead.whatsappNumber,
        initialMessage: lead.initialMessage,
        interestedIn: lead.interestedIn,
        leadScore: lead.leadScore,
      })),
    timestamp: now.toISOString(),
  });

  // Update lead status to 'contacted' after follow-up sent
  for (const lead of dueLead.filter((l) => l.whatsappNumber)) {
    await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, lead.id));
  }
}
