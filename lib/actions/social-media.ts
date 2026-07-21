"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { socialPosts, type SocialPost } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { triggerClient } from "@/trigger/client";
import { processDueSocialPosts } from "@/services/automation/social-media";

export async function getSocialPosts() {
  const session = await auth();
  if (!session?.user) return [];

  const rows = await db.query.socialPosts.findMany({
    orderBy: [desc(socialPosts.createdAt)],
  });

  return rows as SocialPost[];
}

export async function scheduleSocialPost(input: FormData | Record<string, unknown>): Promise<void>;
export async function scheduleSocialPost(input: FormData | Record<string, unknown>, options: { returnId: true }): Promise<string>;
export async function scheduleSocialPost(
  input: FormData | Record<string, unknown>,
  options?: { returnId?: boolean },
): Promise<void | string> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const payload = input instanceof FormData
    ? {
        platform: input.get("platform"),
        caption: input.get("caption"),
        imageUrl: input.get("imageUrl"),
        hashtags: input.get("hashtags"),
        scheduledAt: input.get("scheduledAt"),
      }
    : input;

  const platform = String(payload.platform || "instagram");
  const caption = String(payload.caption || "").trim();
  const imageUrl = String(payload.imageUrl || "").trim();
  const hashtags = String(payload.hashtags || "").trim();
  const scheduledAt = String(payload.scheduledAt || new Date().toISOString());

  if (!caption) {
    throw new Error("Caption is required");
  }

  const createdAt = new Date().toISOString();
  let selectedPlatform: "instagram" | "tiktok" | "youtube" = "instagram";
  if (platform === "tiktok") {
    selectedPlatform = "tiktok";
  } else if (platform === "youtube") {
    selectedPlatform = "youtube";
  }

  const post: typeof socialPosts.$inferInsert = {
    id: crypto.randomUUID(),
    createdBy: session.user.id,
    platform: selectedPlatform,
    caption,
    imageUrl: imageUrl || null,
    hashtags: hashtags || null,
    scheduledAt,
    status: "scheduled" as const,
    externalId: null,
    lastError: null,
    createdAt,
    updatedAt: createdAt,
  };

  await db.insert(socialPosts).values(post);

  if (process.env.TRIGGER_API_KEY) {
    const { TRIGGER_EVENTS } = await import("@/trigger/client");
    await triggerClient.triggerEvent(TRIGGER_EVENTS.SOCIAL_POSTS_PUBLISH, { postId: post.id });
  } else {
    await processDueSocialPosts(new Date(scheduledAt));
  }

  revalidatePath("/settings");
  if (options?.returnId) {
    return post.id;
  }
}

export async function publishSocialPostNow(postId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const post = await db.query.socialPosts.findFirst({ where: eq(socialPosts.id, postId) });
  if (!post) return null;

  await processDueSocialPosts(new Date(post.scheduledAt));
  revalidatePath("/settings");
  return post;
}
