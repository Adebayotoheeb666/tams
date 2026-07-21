import { db } from "@/lib/db";
import { socialPosts } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";
import { processDueSocialPosts } from "@/services/automation/social-media";

export async function socialPostPublisherJob(input?: { postId?: string }) {
  if (input?.postId) {
    const post = await db.query.socialPosts.findFirst({ where: eq(socialPosts.id, input.postId) });
    if (!post) return { ok: true, message: "No post found" };
    const results = await processDueSocialPosts(new Date(post.scheduledAt));
    return { ok: true, results };
  }

  const duePosts = await db.query.socialPosts.findMany({
    where: and(eq(socialPosts.status, "scheduled"), lte(socialPosts.scheduledAt, new Date().toISOString())),
  });

  if (duePosts.length === 0) {
    return { ok: true, results: [] };
  }

  const results = await processDueSocialPosts(new Date());
  return { ok: true, results };
}
