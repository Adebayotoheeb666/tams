#!/usr/bin/env node

/**
 * YouTube OAuth Setup Script
 * 
 * This script helps you obtain a YouTube refresh token for the TBH-IMS platform.
 * 
 * Usage:
 *   npx tsx scripts/youtube-auth.ts
 * 
 * Prerequisites:
 * - Google Cloud project with YouTube Data API v3 enabled
 * - OAuth 2.0 credentials (Client ID, Client Secret)
 * - Environment variables: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET
 */

import { google } from "googleapis";
import { readFile, writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import * as readline from "node:readline";

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("🎬 YouTube OAuth Setup for TBH-IMS");
  console.log("==================================\n");

  // Check for required environment variables
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error(
      "❌ Error: YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET are required in .env file\n",
    );
    console.log("Steps to fix:");
    console.log("1. Go to https://console.cloud.google.com/");
    console.log("2. Create OAuth 2.0 credentials (Web Application)");
    console.log("3. Set redirect URI to: http://localhost:3000/api/auth/youtube/callback");
    console.log("4. Copy the Client ID and Client Secret to .env");
    console.log("\nSee YOUTUBE_SETUP_GUIDE.md for detailed instructions\n");
    process.exit(1);
  }

  console.log("✅ Found OAuth credentials\n");

  // Create OAuth client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:3000/api/auth/youtube/callback",
  );

  const scopes = ["https://www.googleapis.com/auth/youtube.upload"];

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  console.log("📱 Opening authorization URL...\n");
  console.log("If the browser doesn't open, visit this URL:");
  console.log(`${authUrl}\n`);

  // Try to open browser
  try {
    if (process.platform === "darwin") {
      await execAsync(`open "${authUrl}"`);
    } else if (process.platform === "linux") {
      await execAsync(`xdg-open "${authUrl}"`);
    } else if (process.platform === "win32") {
      await execAsync(`start "${authUrl}"`);
    }
  } catch {
    // Browser open failed, user needs to manually open
  }

  // Wait for user to authorize and get code
  const authCode = await question(
    "\n📝 Enter the authorization code from the URL (the 'code' parameter):\n> ",
  );

  if (!authCode) {
    console.error("❌ No authorization code provided\n");
    process.exit(1);
  }

  try {
    console.log("\n⏳ Exchanging code for refresh token...\n");

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(authCode);

    if (!tokens.refresh_token) {
      console.error("❌ No refresh token received. This might happen if you've already authorized.");
      console.error("   Try revoking access at: https://myaccount.google.com/permissions\n");
      process.exit(1);
    }

    // Get channel ID
    console.log("📺 Fetching your YouTube channel info...\n");

    const youtube = google.youtube("v3");
    oauth2Client.setCredentials(tokens);

    const channelResponse = await youtube.channels.list({
      auth: oauth2Client,
      part: ["snippet"],
      mine: true,
    });

    const channelId = channelResponse.data.items?.[0]?.id;
    const channelTitle = channelResponse.data.items?.[0]?.snippet?.title;

    if (!channelId) {
      console.error("❌ Could not retrieve channel ID\n");
      process.exit(1);
    }

    // Display results
    console.log("✅ Authorization successful!\n");
    console.log("📊 Your YouTube Channel:");
    console.log(`   ID: ${channelId}`);
    console.log(`   Name: ${channelTitle}\n`);

    // Prepare .env values
    const envValues = {
      YOUTUBE_REFRESH_TOKEN: tokens.refresh_token,
      YOUTUBE_CHANNEL_ID: channelId,
    };

    // Option to save to .env
    const saveToEnv = await question(
      "💾 Save these values to .env file? (yes/no) [yes]: ",
    );

    if (saveToEnv.toLowerCase() !== "no") {
      try {
        let envContent = await readFile(".env", "utf-8").catch(() => "");

        // Update or add refresh token
        const refreshTokenRegex = /YOUTUBE_REFRESH_TOKEN=.*/;
        const channelIdRegex = /YOUTUBE_CHANNEL_ID=.*/;

        if (refreshTokenRegex.test(envContent)) {
          envContent = envContent.replace(refreshTokenRegex, `YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nYOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`;
        }

        if (channelIdRegex.test(envContent)) {
          envContent = envContent.replace(channelIdRegex, `YOUTUBE_CHANNEL_ID=${channelId}`);
        } else {
          envContent += `\nYOUTUBE_CHANNEL_ID=${channelId}`;
        }

        await writeFile(".env", envContent, "utf-8");

        console.log("✅ Updated .env file\n");
      } catch (error) {
        console.error("❌ Failed to update .env file:");
        console.error(error instanceof Error ? error.message : error);
        console.log("\n📝 Please manually add these to .env:\n");
        console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`YOUTUBE_CHANNEL_ID=${channelId}\n`);
      }
    } else {
      console.log("\n📝 Manually add these to .env:\n");
      console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`YOUTUBE_CHANNEL_ID=${channelId}\n`);
    }

    console.log("🎉 Setup complete!");
    console.log("\nNext steps:");
    console.log("1. Restart your development server: npm run dev");
    console.log("2. Try uploading a video through the marketing dashboard");
    console.log("3. Check your YouTube Studio to see the uploaded video\n");

    console.log("📚 For more info, see: YOUTUBE_SETUP_GUIDE.md\n");
  } catch (error) {
    console.error("❌ Authorization failed:");
    console.error(error instanceof Error ? error.message : error);
    console.log("\nTroubleshooting:");
    console.log("- Make sure you're using the correct Client ID and Secret");
    console.log("- Check that the redirect URI matches: http://localhost:3000/api/auth/youtube/callback");
    console.log("- Try revoking access at: https://myaccount.google.com/permissions\n");
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
