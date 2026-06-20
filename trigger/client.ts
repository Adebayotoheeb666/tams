// Minimal Trigger.dev client scaffold.
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
      name: "export-job",
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
