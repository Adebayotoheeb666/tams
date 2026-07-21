import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../../lib/db";
import { socialPosts } from "../../lib/db/schema";
import { asc, and, eq, lte } from "drizzle-orm";

export type SocialPlatform = "instagram" | "tiktok" | "youtube";
export type SocialPostStatus = "scheduled" | "posting" | "posted" | "failed";

export interface ScheduledSocialPost {
  id: string;
  platform: SocialPlatform;
  caption: string;
  imageUrl?: string;
  hashtags?: string;
  scheduledAt: string;
  status: SocialPostStatus;
  createdAt: string;
  updatedAt: string;
  externalId?: string;
  lastError?: string;
}

interface SocialMediaStore {
  posts: ScheduledSocialPost[];
}

function getStoragePath() {
  return process.env.SOCIAL_MEDIA_STORAGE_PATH?.trim() || path.join(process.cwd(), "data", "social-posts.json");
}

async function readStore(): Promise<SocialMediaStore> {
  const storagePath = getStoragePath();
  const directory = path.dirname(storagePath);
  await mkdir(directory, { recursive: true });

  try {
    const raw = await readFile(storagePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<SocialMediaStore>;
    return { posts: Array.isArray(parsed.posts) ? parsed.posts : [] };
  } catch {
    return { posts: [] };
  }
}

async function writeStore(store: SocialMediaStore) {
  const storagePath = getStoragePath();
  const directory = path.dirname(storagePath);
  await mkdir(directory, { recursive: true });
  await writeFile(storagePath, JSON.stringify(store, null, 2), "utf8");
}

async function dbFallback<T>(runner: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await runner();
  } catch {
    return await fallback();
  }
}

export async function listScheduledSocialPosts() {
  return dbFallback(
    async () => {
      const rows = await db.query.socialPosts.findMany({
        orderBy: [asc(socialPosts.scheduledAt)],
      });
      return rows.map((row) => ({
        id: row.id,
        platform: row.platform as SocialPlatform,
        caption: row.caption,
        imageUrl: row.imageUrl ?? undefined,
        hashtags: row.hashtags ?? undefined,
        scheduledAt: row.scheduledAt,
        status: row.status as SocialPostStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        externalId: row.externalId ?? undefined,
        lastError: row.lastError ?? undefined,
      }));
    },
    async () => {
      const store = await readStore();
      return [...store.posts].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    },
  );
}

export async function createScheduledSocialPost(input: {
  platform: SocialPlatform;
  caption: string;
  imageUrl?: string;
  scheduledAt: string;
  hashtags?: string;
}) {
  const now = new Date().toISOString();
  const post: ScheduledSocialPost = {
    id: crypto.randomUUID(),
    platform: input.platform,
    caption: input.caption.trim(),
    imageUrl: input.imageUrl?.trim(),
    hashtags: input.hashtags?.trim(),
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
  };

  await dbFallback(
    async () => {
      await db.insert(socialPosts).values({
        id: post.id,
        createdBy: process.env.DEFAULT_SOCIAL_POST_OWNER_ID || "system",
        platform: post.platform,
        caption: post.caption,
        imageUrl: post.imageUrl || null,
        hashtags: post.hashtags || null,
        scheduledAt: post.scheduledAt,
        status: post.status,
        externalId: null,
        lastError: null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });
      return post;
    },
    async () => {
      const store = await readStore();
      store.posts.push(post);
      await writeStore(store);
      return post;
    },
  );

  return post;
}

export async function getDueSocialPosts(referenceDate = new Date()) {
  const posts = await listScheduledSocialPosts();
  const threshold = referenceDate.toISOString();
  return posts.filter((post) => post.status === "scheduled" && post.scheduledAt <= threshold);
}

export async function markSocialPostStatus(
  id: string,
  status: SocialPostStatus,
  updates: Partial<ScheduledSocialPost> = {},
) {
  const updatedAt = new Date().toISOString();
  const result = await dbFallback(
    async () => {
      await db.update(socialPosts).set({
        status,
        externalId: updates.externalId ?? null,
        lastError: updates.lastError ?? null,
        updatedAt,
      }).where(eq(socialPosts.id, id));

      const row = await db.query.socialPosts.findFirst({ where: eq(socialPosts.id, id) });
      if (!row) return null;
      return {
        id: row.id,
        platform: row.platform as SocialPlatform,
        caption: row.caption,
        imageUrl: row.imageUrl ?? undefined,
        hashtags: row.hashtags ?? undefined,
        scheduledAt: row.scheduledAt,
        status: row.status as SocialPostStatus,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        externalId: row.externalId ?? undefined,
        lastError: row.lastError ?? undefined,
      } satisfies ScheduledSocialPost;
    },
    async () => {
      const store = await readStore();
      const post = store.posts.find((entry) => entry.id === id);
      if (!post) return null;

      Object.assign(post, {
        ...updates,
        status,
        updatedAt,
      });

      await writeStore(store);
      return post;
    },
  );

  return result;
}

async function getBufferProfileId(platform: SocialPlatform) {
  if (platform === "instagram") {
    return process.env.BUFFER_INSTAGRAM_PROFILE_ID?.trim();
  }
  if (platform === "tiktok") {
    return process.env.BUFFER_TIKTOK_PROFILE_ID?.trim();
  }
  return undefined;
}

async function publishToYouTube(post: ScheduledSocialPost) {
  const { uploadToYouTube } = await import("@/lib/integrations/youtube");

  const videoTitle = post.caption.split("\n")[0]; // First line as title
  const videoDescription = `${post.caption}${post.hashtags ? `\n\n${post.hashtags}` : ""}`;

  // Extract hashtags as YouTube tags
  const tags = post.hashtags
    ? post.hashtags
        .split(/\s+/)
        .filter((tag) => tag.startsWith("#"))
        .map((tag) => tag.slice(1))
    : [];

  if (!post.imageUrl) {
    throw new Error("YouTube posts require an image/video URL");
  }

  try {
    // Upload to YouTube using real API
    const result = await uploadToYouTube({
      title: videoTitle,
      description: videoDescription,
      tags,
      privacyStatus: "unlisted", // Default to unlisted; can be made configurable
      videoUrl: post.imageUrl, // In production, this should be a video file URL
      mimeType: "video/mp4",
      categoryId: "24", // Entertainment category
    });

    // Return with YouTube video ID
    return markSocialPostStatus(post.id, "posted", {
      externalId: result.videoId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to publish to YouTube: ${message}`);
  }
}

export async function publishSocialPost(post: ScheduledSocialPost) {
  await markSocialPostStatus(post.id, "posting");

  if (post.platform === "youtube") {
    return publishToYouTube(post);
  }

  const accessToken = process.env.BUFFER_ACCESS_TOKEN?.trim();
  const profileId = await getBufferProfileId(post.platform);

  if (!accessToken || !profileId) {
    throw new Error(`Buffer credentials are not configured for ${post.platform}`);
  }

  const response = await fetch(process.env.BUFFER_API_URL || "https://api.bufferapp.com/1/updates/create.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "profile_ids[]": profileId,
      text: `${post.caption}${post.hashtags ? ` ${post.hashtags}` : ""}`,
      ...(post.imageUrl ? { "media[photo]": post.imageUrl } : {}),
      scheduled_at: post.scheduledAt,
    }).toString(),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    throw new Error(`Buffer API rejected the request: ${response.status} ${raw}`);
  }

  const payload = await response.json().catch(() => ({}));
  const externalId = payload?.id ?? payload?.data?.id ?? undefined;
  return markSocialPostStatus(post.id, "posted", { externalId });
}

export async function processDueSocialPosts(referenceDate = new Date()) {
  const duePosts = await getDueSocialPosts(referenceDate);
  const results: Array<{ post: ScheduledSocialPost; status: "posted" | "failed"; error?: string }> = [];

  for (const post of duePosts) {
    try {
      const updated = await publishSocialPost(post);
      results.push({ post: updated ?? post, status: "posted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await markSocialPostStatus(post.id, "failed", { lastError: message });
      results.push({ post, status: "failed", error: message });
    }
  }

  return results;
}
