/**
 * YouTube Data API v3 Integration
 * Handles video uploads, metadata, and status tracking
 * 
 * Usage:
 *   import { uploadToYouTube } from "@/lib/integrations/youtube";
 *   const result = await uploadToYouTube({
 *     title: "My Video",
 *     description: "Video description",
 *     videoPath: "/path/to/video.mp4",
 *     privacyStatus: "unlisted"
 *   });
 */

import { google } from "googleapis";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { createReadStream } from "node:fs";

const youtube = google.youtube("v3");

interface YouTubeUploadOptions {
  title: string;
  description: string;
  tags?: string[];
  privacyStatus?: "public" | "unlisted" | "private";
  categoryId?: string; // https://developers.google.com/youtube/v3/docs/videoCategories/list
  videoPath?: string; // Local file path
  videoUrl?: string; // Remote URL to download from
  mimeType?: string;
  recordingDetails?: {
    recordingDate?: string; // ISO 8601
    locationDescription?: string;
  };
  processingDetails?: {
    processingProgress?: {
      partsTotal: number;
      partsProcessed: number;
      timeLeftMillis: number;
    };
  };
}

interface YouTubeUploadResult {
  videoId: string;
  url: string;
  title: string;
  status: string;
  uploadedAt: string;
  processingStatus?: "processing" | "succeeded" | "failed";
  processingFailureReason?: string;
}

interface YouTubeErrorResponse {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

/**
 * Validates YouTube API credentials are configured
 */
function validateCredentials() {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim();
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN?.trim();

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not configured");
  }

  if (!channelId) {
    throw new Error("YOUTUBE_CHANNEL_ID environment variable is not configured");
  }

  if (!refreshToken) {
    throw new Error("YOUTUBE_REFRESH_TOKEN environment variable is not configured");
  }

  return { apiKey, channelId, refreshToken };
}

/**
 * Creates authenticated YouTube client
 */
function createYouTubeClient() {
  const { refreshToken } = validateCredentials();

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3000/api/auth/youtube/callback",
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.youtube({
    version: "v3",
    auth: oauth2Client,
  });
}

/**
 * Downloads video from URL and returns ReadStream
 * For production, consider using a storage service like Google Cloud Storage
 */
async function downloadVideoFromUrl(
  url: string,
  maxSizeBytes = 5 * 1024 * 1024 * 1024,
): Promise<NodeJS.ReadableStream | ReadableStream<Uint8Array>> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (TBH-IMS/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSizeBytes) {
    throw new Error(`Video exceeds maximum size of ${maxSizeBytes / 1024 / 1024 / 1024}GB`);
  }

  if (!response.body) {
    throw new Error("No response body from video URL");
  }

  return response.body;
}

/**
 * Get video file stream (local or remote)
 */
async function getVideoStream(options: YouTubeUploadOptions): Promise<{
  stream: NodeJS.ReadableStream | ReadableStream<Uint8Array>;
  mimeType: string;
  filename: string;
}> {
  if (options.videoPath) {
    const buffer = await readFile(options.videoPath);
    const mimeType = options.mimeType || "video/mp4";
    const filename = basename(options.videoPath);

    return {
      stream: createReadStream(options.videoPath),
      mimeType,
      filename,
    };
  }

  if (options.videoUrl) {
    const stream = await downloadVideoFromUrl(options.videoUrl);
    const mimeType = options.mimeType || "video/mp4";
    const urlObj = new URL(options.videoUrl);
    const filename = basename(urlObj.pathname) || "video.mp4";

    return {
      stream,
      mimeType,
      filename,
    };
  }

  throw new Error("Either videoPath or videoUrl must be provided");
}

/**
 * Upload video to YouTube with resumable upload support
 * Handles large files and network interruptions gracefully
 */
export async function uploadToYouTube(options: YouTubeUploadOptions): Promise<YouTubeUploadResult> {
  try {
    const { channelId } = validateCredentials();
    const youtubeClient = createYouTubeClient();
    const { stream, mimeType, filename } = await getVideoStream(options);

    console.log(`[YouTube] Starting upload: ${options.title}`);
    console.log(`[YouTube] File: ${filename} (${mimeType})`);
    console.log(`[YouTube] Privacy: ${options.privacyStatus || "private"}`);

    // Build request body
    const requestBody = {
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags || [],
        categoryId: options.categoryId || "24", // 24 = Entertainment
        defaultLanguage: "en",
      },
      status: {
        privacyStatus: options.privacyStatus || "private",
        selfDeclaredMadeForKids: false,
      },
      processingDetails:
        options.processingDetails && options.processingDetails.processingProgress
          ? {
              processingProgress: options.processingDetails.processingProgress,
            }
          : undefined,
      recordingDetails: options.recordingDetails
        ? {
            recordingDate: options.recordingDetails.recordingDate,
            locationDescription: options.recordingDetails.locationDescription,
          }
        : undefined,
    } as any;

    // Use resumable upload for better reliability
    const response = await youtubeClient.videos.insert(
      {
        part: ["snippet", "status", "processingDetails", "recordingDetails"],
        requestBody: requestBody,
        media: {
          mimeType,
          body: stream,
        },
      },
      {
        responseType: "json",
        onUploadProgress: (progressEvent: { bytesProcessed: number; estimatedTotalBytes?: number }) => {
          const totalBytes = progressEvent.estimatedTotalBytes ?? progressEvent.bytesProcessed;
          const progress = Math.round((progressEvent.bytesProcessed / totalBytes) * 100);
          console.log(`[YouTube] Upload progress: ${progress}%`);
        },
      },
    );

    const responseData = (response as { data?: { id?: string; status?: { uploadStatus?: string }; processingDetails?: { processingStatus?: "processing" | "succeeded" | "failed"; processingFailureReason?: string } } }).data;
    const videoId = responseData?.id;
    if (!videoId) {
      throw new Error("No video ID returned from YouTube API");
    }

    const uploadResult: YouTubeUploadResult = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: options.title,
      status: responseData?.status?.uploadStatus || "uploaded",
      uploadedAt: new Date().toISOString(),
      processingStatus: (responseData?.processingDetails?.processingStatus as
        | "processing"
        | "succeeded"
        | "failed"
        | undefined) || "processing",
      processingFailureReason: responseData?.processingDetails?.processingFailureReason,
    };

    console.log(`[YouTube] Upload successful:`, uploadResult);
    return uploadResult;
  } catch (error) {
    const err = error as YouTubeErrorResponse | Error;
    const message =
      "code" in err && "message" in err ? `${err.code}: ${err.message}` : error instanceof Error ? error.message : "Unknown error";

    console.error(`[YouTube] Upload failed: ${message}`);
    throw new Error(`YouTube upload failed: ${message}`);
  }
}

/**
 * Get video status from YouTube
 */
export async function getVideoStatus(videoId: string) {
  try {
    const youtubeClient = createYouTubeClient();

    const response = await youtubeClient.videos.list({
      part: ["processingDetails", "status", "snippet"],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    return {
      videoId,
      title: video.snippet?.title,
      status: video.status?.uploadStatus,
      privacyStatus: video.status?.privacyStatus,
      processingStatus: video.processingDetails?.processingStatus,
      processingFailureReason: video.processingDetails?.processingFailureReason,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error(`[YouTube] Failed to get status for ${videoId}:`, error);
    throw error;
  }
}

/**
 * Update video metadata (title, description, privacy)
 */
export async function updateVideoMetadata(
  videoId: string,
  updates: {
    title?: string;
    description?: string;
    tags?: string[];
    privacyStatus?: "public" | "unlisted" | "private";
  },
) {
  try {
    const youtubeClient = createYouTubeClient();

    const response = await youtubeClient.videos.update({
      part: ["snippet", "status"],
      requestBody: {
        id: videoId,
        snippet: {
          title: updates.title,
          description: updates.description,
          tags: updates.tags,
        },
        status: {
          privacyStatus: updates.privacyStatus,
        },
      },
    });

    console.log(`[YouTube] Updated video ${videoId}`);
    return response.data;
  } catch (error) {
    console.error(`[YouTube] Failed to update video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Delete video from YouTube
 */
export async function deleteVideo(videoId: string) {
  try {
    const youtubeClient = createYouTubeClient();

    await youtubeClient.videos.delete({
      id: videoId,
    });

    console.log(`[YouTube] Deleted video ${videoId}`);
    return { success: true, videoId };
  } catch (error) {
    console.error(`[YouTube] Failed to delete video ${videoId}:`, error);
    throw error;
  }
}

/**
 * Initialize YouTube OAuth flow (for server-to-user setup)
 * Use this for first-time YouTube channel authentication
 */
export function getYouTubeAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3000/api/auth/youtube/callback",
  );

  const scopes = ["https://www.googleapis.com/auth/youtube.upload"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return url;
}
