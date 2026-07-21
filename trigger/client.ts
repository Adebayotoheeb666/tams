// Trigger.dev client with standardized event naming (hierarchical dot-notation)

/**
 * Standardized event names using hierarchical dot-notation
 * Organized by: resource.action.detail
 * Examples: social.posts.publish, inventory.alerts.low-stock
 */
export const TRIGGER_EVENTS = {
  // Social Media
  SOCIAL_POSTS_PUBLISH: "social.posts.publish",

  // Inventory
  INVENTORY_ALERTS_LOW_STOCK: "inventory.alerts.low-stock",

  // Appointments
  APPOINTMENTS_REMINDERS_SEND: "appointments.reminders.send",
  APPOINTMENTS_CONFIRMATIONS_SEND: "appointments.confirmations.send",

  // Exports
  EXPORTS_STATEMENTS_GENERATE: "exports.statements.generate",

  // Leads (scheduled)
  LEADS_FOLLOWUPS_SEND: "leads.followups.send",

  // Summaries (scheduled)
  SUMMARIES_DAILY_GENERATE: "summaries.daily.generate",

  // Statements (scheduled)
  STATEMENTS_MONTHLY_GENERATE: "statements.monthly.generate",

  // Customers (scheduled)
  CUSTOMERS_JOURNEYS_SYNC: "customers.journeys.sync",
} as const;

const triggerApiUrl = process.env.TRIGGER_API_URL ?? "https://api.trigger.dev/v1/runs";

async function triggerRequest(body: Record<string, unknown>) {
  const key = process.env.TRIGGER_API_KEY;
  if (!key) throw new Error("TRIGGER_API_KEY not configured");

  const res = await fetch(triggerApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trigger API error: ${text}`);
  }

  return await res.json();
}

export const triggerClient = {
  async runExport(jobId: string) {
    return await triggerRequest({
      name: TRIGGER_EVENTS.EXPORTS_STATEMENTS_GENERATE,
      input: { jobId },
    });
  },

  async triggerEvent(name: string, payload: Record<string, unknown>) {
    return await triggerRequest({
      name,
      input: payload,
    });
  },
};
