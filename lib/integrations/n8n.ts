export function buildN8nWebhookUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export async function forwardToN8nWebhook(path: string, payload: unknown) {
  const automationBaseUrl = process.env.AUTOMATION_WEBHOOK_BASE_URL?.trim();
  const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL?.trim();
  const baseUrl = automationBaseUrl || n8nBaseUrl;

  if (!baseUrl) {
    throw new Error("No automation webhook target is configured");
  }

  const url = buildN8nWebhookUrl(baseUrl, path);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.AUTOMATION_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET
        ? {
            "x-automation-webhook-secret": process.env.AUTOMATION_WEBHOOK_SECRET || process.env.N8N_WEBHOOK_SECRET || "",
            "x-n8n-webhook-secret": process.env.N8N_WEBHOOK_SECRET || process.env.AUTOMATION_WEBHOOK_SECRET || "",
          }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Automation webhook rejected the request with status ${response.status}`);
  }

  return response;
}
