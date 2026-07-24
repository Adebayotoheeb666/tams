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

const triggerApiBaseUrl = (() => {
  const rawUrl = process.env.TRIGGER_API_URL?.trim() || "https://cloud.trigger.dev";
  let normalizedUrl = rawUrl.replace(/\/+$/, "");

  if (normalizedUrl.endsWith("/api/v1/runs")) {
    normalizedUrl = normalizedUrl.slice(0, -"/api/v1/runs".length);
  } else if (normalizedUrl.endsWith("/api/v1")) {
    normalizedUrl = normalizedUrl.slice(0, -"/api/v1".length);
  }

  return normalizedUrl;
})();

async function triggerRequest(taskId: string, payload: Record<string, unknown>) {
  const key = process.env.TRIGGER_API_KEY;
  if (!key) throw new Error("TRIGGER_API_KEY not configured");

  const url = new URL(`/api/v1/tasks/${encodeURIComponent(taskId)}/trigger`, triggerApiBaseUrl).toString();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      payload,
      context: {},
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trigger API error: ${res.status} ${text}`);
  }

  return await res.json();
}

export const triggerClient = {
  async runExport(jobId: string) {
    return await triggerRequest(TRIGGER_EVENTS.EXPORTS_STATEMENTS_GENERATE, { jobId });
  },

  async triggerEvent(name: string, payload: Record<string, unknown>) {
    return await triggerRequest(name, payload);
  },
};
