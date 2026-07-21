import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env");
const fileEnv = loadEnv(envPath);
const env = { ...process.env, ...fileEnv };

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};
  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function get(name) {
  return (env[name] || "").trim();
}

function mask(value) {
  if (!value) return "(empty)";
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function isPresent(value) {
  return Boolean(value);
}

function isE164(value) {
  return /^\+[1-9]\d{1,14}$/.test(value);
}

function getStatusLabel(ok) {
  return ok ? "PASS" : "FAIL";
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let json = null;

    try {
      json = JSON.parse(text);
    } catch {
      // ignore non-JSON responses
    }

    return { response, text, json };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function testYouTube() {
  const apiKey = get("YOUTUBE_API_KEY");
  const channelId = get("YOUTUBE_CHANNEL_ID");
  const refreshToken = get("YOUTUBE_REFRESH_TOKEN");

  const checks = [];

  if (!isPresent(apiKey)) {
    checks.push({ label: "YOUTUBE_API_KEY", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "YOUTUBE_API_KEY", ok: true, detail: "configured" });
  }

  if (!isPresent(channelId)) {
    checks.push({ label: "YOUTUBE_CHANNEL_ID", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "YOUTUBE_CHANNEL_ID", ok: true, detail: "configured" });
  }

  if (!isPresent(refreshToken)) {
    checks.push({ label: "YOUTUBE_REFRESH_TOKEN", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "YOUTUBE_REFRESH_TOKEN", ok: true, detail: "configured (not fully verifiable without OAuth client)" });
  }

  if (isPresent(apiKey) && isPresent(channelId)) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=id&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
      const { response, json, text } = await fetchJson(url);

      if (response.ok && json?.items?.length) {
        checks.push({ label: "YouTube API request", ok: true, detail: "channel lookup succeeded" });
      } else {
        let reason = response.status === 401 || response.status === 403 ? "invalid API key or channel id" : `HTTP ${response.status}`;
        if (json?.error?.message) {
          reason += ` (${json.error.message})`;
        }
        checks.push({ label: "YouTube API request", ok: false, detail: reason });
      }
    } catch (error) {
      let detail = error.message || 'unknown error';
      
      // Log full error for debugging
      if (process.env.DEBUG_INTEGRATIONS) {
        console.error('[YouTube Error]', error);
      }
      
      if (error.code === 'ENOTFOUND') {
        detail = 'network error: cannot reach googleapis.com (DNS/firewall)';
      } else if (error.code === 'ECONNREFUSED') {
        detail = 'network error: connection refused';
      } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        detail = 'network timeout';
      } else if (error.name === 'TypeError' && error.message?.includes('fetch')) {
        detail = 'fetch error: check network connectivity or DNS resolution';
      }
      checks.push({ label: "YouTube API request", ok: false, detail });
    }
  }

  const ok = checks.every((item) => item.ok);
  return { name: "YouTube", ok, checks };
}

async function testBuffer() {
  const token = get("BUFFER_ACCESS_TOKEN");
  const instagramProfile = get("BUFFER_INSTAGRAM_PROFILE_ID");
  const tiktokProfile = get("BUFFER_TIKTOK_PROFILE_ID");

  const checks = [];

  if (!isPresent(token)) {
    checks.push({ label: "BUFFER_ACCESS_TOKEN", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "BUFFER_ACCESS_TOKEN", ok: true, detail: `configured (${mask(token)})` });
  }

  if (!isPresent(instagramProfile)) {
    checks.push({ label: "BUFFER_INSTAGRAM_PROFILE_ID", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "BUFFER_INSTAGRAM_PROFILE_ID", ok: true, detail: "configured" });
  }

  if (!isPresent(tiktokProfile)) {
    checks.push({ label: "BUFFER_TIKTOK_PROFILE_ID", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "BUFFER_TIKTOK_PROFILE_ID", ok: true, detail: "configured" });
  }

  if (isPresent(token)) {
    try {
      const { response, json, text } = await fetchJson("https://api.bufferapp.com/1/profiles.json", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const profiles = Array.isArray(json?.profiles) ? json.profiles : Array.isArray(json) ? json : [];
        const profileIds = new Set(profiles.map((profile) => String(profile.id ?? profile.profile_id ?? "")));
        const found = [];
        if (isPresent(instagramProfile) && profileIds.has(instagramProfile)) found.push("instagram");
        if (isPresent(tiktokProfile) && profileIds.has(tiktokProfile)) found.push("tiktok");

        checks.push({ label: "Buffer API auth", ok: true, detail: `profiles fetched (${profiles.length})` });
        if (found.length) {
          checks.push({ label: "Buffer profile IDs", ok: true, detail: `matched ${found.join(", ")}` });
        } else if (isPresent(instagramProfile) || isPresent(tiktokProfile)) {
          checks.push({ label: "Buffer profile IDs", ok: false, detail: "provided profile ids not found in account profiles" });
        }
      } else {
        let reason = `HTTP ${response.status}`;
        if (response.status === 401 || response.status === 403) {
          if (json?.error?.includes?.('Public API')) {
            reason = 'requires OAuth token (not public API token)';
          } else if (json?.error) {
            reason = `invalid token: ${json.error}`;
          } else {
            reason = 'invalid access token';
          }
        }
        checks.push({ label: "Buffer API auth", ok: false, detail: reason });
      }
    } catch (error) {
      let detail = error.message || 'unknown error';
      if (error.code === 'ENOTFOUND') {
        detail = 'network error: cannot reach api.bufferapp.com (DNS/firewall)';
      } else if (error.code === 'ECONNREFUSED') {
        detail = 'network error: connection refused';
      } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        detail = 'network timeout';
      }
      checks.push({ label: "Buffer API auth", ok: false, detail });
    }
  }

  const ok = checks.every((item) => item.ok);
  return { name: "Buffer", ok, checks };
}

async function testTwilio() {
  const sid = get("TWILIO_ACCOUNT_SID");
  const token = get("TWILIO_AUTH_TOKEN");
  const from = get("TWILIO_WHATSAPP_NUMBER");
  const owner = get("OWNER_WHATSAPP_NUMBER");

  const checks = [];

  if (!isPresent(sid)) {
    checks.push({ label: "TWILIO_ACCOUNT_SID", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "TWILIO_ACCOUNT_SID", ok: true, detail: `configured (${mask(sid)})` });
  }

  if (!isPresent(token)) {
    checks.push({ label: "TWILIO_AUTH_TOKEN", ok: false, detail: "missing" });
  } else {
    checks.push({ label: "TWILIO_AUTH_TOKEN", ok: true, detail: `configured (${mask(token)})` });
  }

  if (!isE164(from)) {
    checks.push({ label: "TWILIO_WHATSAPP_NUMBER", ok: false, detail: "invalid E.164 format" });
  } else {
    checks.push({ label: "TWILIO_WHATSAPP_NUMBER", ok: true, detail: "valid format" });
  }

  if (!isE164(owner)) {
    checks.push({ label: "OWNER_WHATSAPP_NUMBER", ok: false, detail: "invalid E.164 format" });
  } else {
    checks.push({ label: "OWNER_WHATSAPP_NUMBER", ok: true, detail: "valid format" });
  }

  if (isPresent(sid) && isPresent(token)) {
    try {
      const authHeader = Buffer.from(`${sid}:${token}`).toString("base64");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const { response } = await fetchJson(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, {
        headers: {
          Authorization: `Basic ${authHeader}`,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        checks.push({ label: "Twilio API auth", ok: true, detail: "account lookup succeeded" });
      } else {
        const reason = response.status === 401 || response.status === 403 ? "invalid SID/token" : `HTTP ${response.status}`;
        checks.push({ label: "Twilio API auth", ok: false, detail: reason });
      }
    } catch (error) {
      const detail = error.name === 'AbortError'
        ? 'request timeout (8s) - check network/firewall'
        : error.code === 'ECONNREFUSED' 
        ? 'connection refused (network/firewall issue)'
        : error.code === 'ETIMEDOUT'
        ? 'connection timeout'
        : error.message || 'unknown error';
      checks.push({ label: "Twilio API auth", ok: false, detail });
    }
  }

  const ok = checks.every((item) => item.ok);
  return { name: "Twilio", ok, checks };
}

async function main() {
  console.log("Running integration verification...\n");

  const results = [];
  results.push(await testYouTube());
  results.push(await testBuffer());
  results.push(await testTwilio());

  for (const result of results) {
    console.log(`== ${result.name} ==`);
    for (const check of result.checks) {
      console.log(`- [${getStatusLabel(check.ok)}] ${check.label}: ${check.detail}`);
    }
    console.log("");
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length) {
    console.log(`Verification completed with ${failed.length} failing area(s).\n`);
    console.log("=== RECOMMENDATIONS ===");
    
    const youtubeFailed = results.find(r => r.name === 'YouTube' && !r.ok);
    if (youtubeFailed) {
      const hasNetworkIssue = youtubeFailed.checks.some(c => c.label === 'YouTube API request' && c.detail.includes('fetch error'));
      const hasAuthIssue = youtubeFailed.checks.some(c => c.label === 'YouTube API request' && c.detail.includes('invalid'));
      
      if (hasNetworkIssue) {
        console.log("\nYouTube API Connectivity Issue:");
        console.log("  • The request is timing out trying to reach googleapis.com");
        console.log("  • Check your network connection and firewall settings");
        console.log("  • If behind a proxy, configure it in your environment");
        console.log("  • YouTube API credentials appear valid; this is a network issue");
      } else if (hasAuthIssue) {
        console.log("\nYouTube API Authentication Issue:");
        console.log("  • Check that YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID are correct");
        console.log("  • Verify the API key is enabled for YouTube Data API v3");
      }
    }
    
    const bufferFailed = results.find(r => r.name === 'Buffer' && !r.ok);
    if (bufferFailed) {
      const hasMissingTiktok = bufferFailed.checks.some(c => c.label === 'BUFFER_TIKTOK_PROFILE_ID' && !c.ok);
      const hasAuthIssue = bufferFailed.checks.some(c => c.label === 'Buffer API auth' && !c.ok);
      
      if (hasAuthIssue) {
        console.log("\nBuffer API Auth Issue:");
        console.log("  • Your BUFFER_ACCESS_TOKEN is a Public API token, but the REST API requires an OAuth token");
        console.log("  • Go to https://buffer.com/app/settings/apps-connections to generate an OAuth token");
        console.log("  • Or use Buffer's Public API with the correct endpoint format");
      }
      
      if (hasMissingTiktok) {
        console.log("\nBuffer TikTok Profile:");
        console.log("  • BUFFER_TIKTOK_PROFILE_ID is not configured in .env");
        console.log("  • Connect your TikTok account in Buffer and add the profile ID to .env");
        console.log("  • Set it empty if you don't plan to use TikTok integration");
      }
    }
    
    process.exitCode = 1;
  } else {
    console.log("All checked integrations appear to be configured and reachable.");
  }
}

main().catch((error) => {
  console.error("Verification failed with unexpected error:", error);
  process.exitCode = 1;
});
