# YouTube API v3 Setup Guide

This guide walks you through setting up YouTube API authentication for the TBH-IMS platform to enable automatic video uploads.

## Prerequisites

- Google Cloud Project with YouTube Data API v3 enabled
- A YouTube channel (business channel recommended)
- OAuth 2.0 credentials (Client ID, Client Secret)
- Server running at a publicly accessible URL (for OAuth callback)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Name: `TBH-IMS-YouTube` (or similar)
5. Click "CREATE"

---

## Step 2: Enable YouTube Data API v3

1. In the Cloud Console, search for "YouTube Data API v3"
2. Click the result
3. Click "ENABLE"
4. Wait for the API to enable (1-2 minutes)

---

## Step 3: Create OAuth 2.0 Credentials

1. In the Cloud Console, go to **APIs & Services → Credentials**
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External**
   - App name: `TBH-IMS`
   - User support email: your-email@example.com
   - App logo: (optional)
   - Scopes: Add `https://www.googleapis.com/auth/youtube.upload`
   - Save and continue

4. Back to credentials:
   - Application type: **Web application**
   - Name: `TBH-IMS Server`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/youtube/callback` (development)
     - `https://yourdomain.com/api/auth/youtube/callback` (production)
   - Click "CREATE"

5. Copy the credentials and save them:
   ```
   CLIENT_ID: xxx.apps.googleusercontent.com
   CLIENT_SECRET: xxx
   ```

---

## Step 4: Get Initial Refresh Token

You need to authenticate once to get a refresh token. Follow these steps:

### Option A: Using the Setup Script (Recommended)

```bash
# In the project root
npm run youtube:auth
```

This will:
1. Open a browser to Google OAuth login
2. Ask for permission to upload to YouTube
3. Save the refresh token to `.env`

### Option B: Manual Setup

1. Visit this URL in your browser (replace with your CLIENT_ID):
   ```
   https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/api/auth/youtube/callback&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline&prompt=consent
   ```

2. Grant access when prompted
3. You'll be redirected to `http://localhost:3000/?code=...`
4. Copy the authorization code
5. Exchange it for a refresh token using curl:
   ```bash
   curl -X POST https://oauth2.googleapis.com/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=authorization_code&code=AUTHORIZATION_CODE&redirect_uri=http://localhost:3000/api/auth/youtube/callback"
   ```

6. The response will include `refresh_token` - copy this value

---

## Step 5: Configure Environment Variables

Add these to your `.env` file:

```dotenv
# YouTube API Credentials
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY
YOUTUBE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
YOUTUBE_CHANNEL_ID=YOUR_YOUTUBE_CHANNEL_ID
YOUTUBE_REFRESH_TOKEN=YOUR_GOOGLE_REFRESH_TOKEN
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
```

### Variable Explanations:

| Variable | Source | Description |
|---|---|---|
| `YOUTUBE_API_KEY` | Google Cloud Console | API key for basic requests |
| `YOUTUBE_CLIENT_ID` | OAuth credentials | OAuth 2.0 client ID |
| `YOUTUBE_CLIENT_SECRET` | OAuth credentials | OAuth 2.0 client secret |
| `YOUTUBE_CHANNEL_ID` | YouTube channel URL | Your YouTube channel ID (UC...) |
| `YOUTUBE_REFRESH_TOKEN` | OAuth flow | Refresh token for long-lived auth |
| `YOUTUBE_REDIRECT_URI` | Your setup | Callback URL after OAuth |

---

## Step 6: Get Your YouTube Channel ID

1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click your profile icon → "Settings"
3. Look for "Channel ID" (format: `UCxxxxxxxxxxxxxxxx`)
4. Copy and paste into `.env`

---

## Step 7: Test the Integration

Run this test command:

```bash
# Create a test upload
npm run youtube:test -- --file ./test-video.mp4 --title "Test Upload"
```

Expected output:
```
[YouTube] Starting upload: Test Upload
[YouTube] File: test-video.mp4 (video/mp4)
[YouTube] Privacy: private
[YouTube] Upload progress: 25%
[YouTube] Upload progress: 50%
[YouTube] Upload progress: 75%
[YouTube] Upload progress: 100%
[YouTube] Upload successful:
{
  videoId: "dQw4w9WgXcQ",
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "Test Upload",
  status: "uploaded",
  uploadedAt: "2026-07-18T10:30:00.000Z",
  processingStatus: "processing"
}
```

---

## Troubleshooting

### Error: "YOUTUBE_API_KEY not configured"
- Make sure all variables are set in `.env`
- Restart the development server: `npm run dev`
- Check `echo $YOUTUBE_API_KEY` in terminal

### Error: "Invalid refresh token"
- The refresh token has expired
- Re-run the authentication flow: `npm run youtube:auth`
- Update `.env` with the new token

### Error: "Video exceeds maximum size"
- YouTube has a file size limit (~128 GB for most accounts)
- Compress your video or use a smaller file
- For shorts (under 60 seconds): use MP4 format, 9:16 aspect ratio

### Error: "Authentication failed"
- Check that redirect URIs match exactly
- If using HTTPS, add both `http://` and `https://` versions
- Clear browser cookies and try again

### Error: "The user has not enabled the developer"
- The OAuth consent screen may not be configured correctly
- Go back to Step 3 and ensure scopes include `youtube.upload`

---

## API Usage Limits

- **YouTube Data API**: 10,000 units/day (shared quota)
- **Video uploads**: 1 file/day per unverified account, unlimited for verified
- **Processing queue**: Videos enter a processing queue; don't delete immediately

Check quota at: [Google Cloud Console → APIs & Services → YouTube Data API v3](https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas)

---

## Production Deployment

### Before going live:

1. **Move to service account** (optional but recommended):
   - Service accounts don't require user interaction
   - Better for background jobs and Trigger.dev
   - Contact Google for a service account refresh token

2. **Request quota increase**:
   - Default: 10,000 units/day
   - Submit request in Google Cloud Console
   - Usually approved within 24 hours

3. **Use Google Cloud Storage** for video staging:
   ```typescript
   // Instead of downloading from imageUrl, upload to GCS first
   // Then reference GCS URI in YouTube upload
   ```

4. **Add error monitoring**:
   - All errors are logged to console
   - Add Sentry/Rollbar for production
   - Monitor processing failures

5. **Update redirect URIs**:
   ```
   https://yourdomain.com/api/auth/youtube/callback
   https://yourdomain.com/api/webhooks/youtube
   ```

---

## API Reference

### Upload Video

```typescript
import { uploadToYouTube } from "@/lib/integrations/youtube";

const result = await uploadToYouTube({
  title: "My Video",
  description: "A great video about...",
  videoUrl: "https://example.com/video.mp4",
  tags: ["tag1", "tag2"],
  privacyStatus: "unlisted", // public, unlisted, private
});

// Returns:
// {
//   videoId: "dQw4w9WgXcQ",
//   url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
//   title: "My Video",
//   status: "uploaded",
//   uploadedAt: "2026-07-18T...",
//   processingStatus: "processing"
// }
```

### Check Video Status

```typescript
import { getVideoStatus } from "@/lib/integrations/youtube";

const status = await getVideoStatus("dQw4w9WgXcQ");
// Returns: { videoId, title, status, processingStatus, ... }
```

### Update Video Metadata

```typescript
import { updateVideoMetadata } from "@/lib/integrations/youtube";

await updateVideoMetadata("dQw4w9WgXcQ", {
  title: "Updated Title",
  description: "Updated description",
  privacyStatus: "public",
});
```

### Delete Video

```typescript
import { deleteVideo } from "@/lib/integrations/youtube";

await deleteVideo("dQw4w9WgXcQ");
```

---

## References

- [YouTube Data API v3 Docs](https://developers.google.com/youtube/v3)
- [OAuth 2.0 for Server Applications](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Resumable Upload Protocol](https://developers.google.com/youtube/v3/guides/using_the_videos_insert_endpoint)

