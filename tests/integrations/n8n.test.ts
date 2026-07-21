import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildN8nWebhookUrl, forwardToN8nWebhook } from "../../lib/integrations/n8n";

describe("n8n webhook bridge", () => {
  const originalBaseUrl = process.env.N8N_WEBHOOK_BASE_URL;
  const originalSecret = process.env.N8N_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.N8N_WEBHOOK_BASE_URL;
    else process.env.N8N_WEBHOOK_BASE_URL = originalBaseUrl;

    if (originalSecret === undefined) delete process.env.N8N_WEBHOOK_SECRET;
    else process.env.N8N_WEBHOOK_SECRET = originalSecret;
  });

  it("builds a webhook URL from the base URL and path", () => {
    expect(buildN8nWebhookUrl("https://n8n.example.com/", "/webhook/test")).toBe("https://n8n.example.com/webhook/test");
    expect(buildN8nWebhookUrl("https://n8n.example.com", "webhook/test")).toBe("https://n8n.example.com/webhook/test");
  });

  it("forwards payloads to n8n with the shared secret header", async () => {
    process.env.N8N_WEBHOOK_BASE_URL = "https://n8n.example.com";
    process.env.N8N_WEBHOOK_SECRET = "top-secret";

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await forwardToN8nWebhook("/webhook/test", { hello: "world" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-n8n-webhook-secret": "top-secret",
        }),
        body: JSON.stringify({ hello: "world" }),
      }),
    );
  });
});
