import http from "node:http";
import { buildEventMessage, buildInboundReply } from "./logic";
import {
  createScheduledSocialPost,
  listScheduledSocialPosts,
  processDueSocialPosts,
} from "./social-media";

const port = Number(process.env.AUTOMATION_PORT ?? 4000);
const host = process.env.AUTOMATION_HOST ?? "0.0.0.0";

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({ raw: body });
      }
    });
    req.on("error", reject);
  });
}

function verifySecret(req: http.IncomingMessage) {
  const secret = process.env.AUTOMATION_WEBHOOK_SECRET ?? process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return true;

  const header = req.headers["x-automation-webhook-secret"] || req.headers["x-n8n-webhook-secret"];
  return header === secret;
}

async function sendTwilioMessage(to: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!sid || !token || !from || !to) {
    console.log("Twilio not configured; skipping outbound message.");
    return;
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    From: `whatsapp:${from}`,
    To: `whatsapp:${to}`,
    Body: message,
  });

  const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Twilio rejected the message with status ${response.status}`);
  }
}

async function handleInbound(body: any) {
  const from = body?.from || body?.From || body?.phone || body?.customerPhone || "";
  const incomingMessage = body?.message || body?.Body || body?.text || body?.body || "";
  const name = body?.name || body?.ProfileName || body?.profile_name || "there";

  const reply = buildInboundReply({ name, message: String(incomingMessage) });
  console.log("Inbound message received", { from, incomingMessage });

  if (from) {
    await sendTwilioMessage(String(from), reply);
  }

  return { ok: true, reply };
}

async function handleEvent(event: string, payload: any) {
  const message = buildEventMessage(event, payload);
  console.log(`Automation event: ${event}`, payload);

  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  if (ownerNumber) {
    await sendTwilioMessage(ownerNumber, message);
  }

  return { ok: true, message };
}

async function handleSocialPost(body: any) {
  const platformValue = body?.platform || "instagram";
  let platform: "instagram" | "tiktok" | "youtube" = "instagram";

  if (platformValue === "tiktok") {
    platform = "tiktok";
  } else if (platformValue === "youtube") {
    platform = "youtube";
  } else {
    platform = "instagram";
  }

  const post = await createScheduledSocialPost({
    platform,
    caption: body?.caption || body?.text || "Fresh arrivals from Tams Beauty Hub",
    imageUrl: body?.imageUrl || body?.mediaUrl || undefined,
    scheduledAt: body?.scheduledAt || new Date().toISOString(),
    hashtags: body?.hashtags || undefined,
  });

  return { ok: true, post };
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "automation" }));
    return;
  }

  if (!req.url) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Missing path" }));
    return;
  }

  if (!verifySecret(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
  const body = await readBody(req);

  try {
    let response: unknown;
    if (pathname === "/webhook/whatsapp-inbound") {
      response = await handleInbound(body);
    } else if (pathname === "/webhook/appointment-booked") {
      response = await handleEvent("appointment", body);
    } else if (pathname === "/webhook/low-stock") {
      response = await handleEvent("low-stock", body);
    } else if (pathname === "/webhook/sale-completed") {
      response = await handleEvent("sale", body);
    } else if (pathname === "/webhook/social-post") {
      response = await handleSocialPost(body);
    } else if (req.method === "POST" && pathname === "/api/social/posts") {
      response = await handleSocialPost(body);
    } else if (req.method === "GET" && pathname === "/api/social/posts") {
      response = { ok: true, posts: await listScheduledSocialPosts() };
    } else if (req.method === "POST" && pathname === "/api/social/process") {
      response = { ok: true, results: await processDueSocialPosts() };
    } else {
      response = { ok: true, message: "Unhandled route" };
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  } catch (error) {
    console.error("Automation service error", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Automation failed" }));
  }
});

setInterval(() => {
  void processDueSocialPosts().catch((error) => {
    console.error("Failed to process due social posts", error);
  });
}, 60_000);

server.listen(port, host, () => {
  console.log(`Automation service listening on http://${host}:${port}`);
});
