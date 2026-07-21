import { afterEach, describe, expect, it } from "vitest";
import {
  createScheduledSocialPost,
  getDueSocialPosts,
  markSocialPostStatus,
  type ScheduledSocialPost,
} from "../../services/automation/social-media";

describe("social media scheduling", () => {
  const originalStoragePath = process.env.SOCIAL_MEDIA_STORAGE_PATH;

  afterEach(() => {
    if (originalStoragePath === undefined) {
      delete process.env.SOCIAL_MEDIA_STORAGE_PATH;
    } else {
      process.env.SOCIAL_MEDIA_STORAGE_PATH = originalStoragePath;
    }
  });

  it("stores and returns posts that are due", async () => {
    process.env.SOCIAL_MEDIA_STORAGE_PATH = "/tmp/tbh-social-media-test.json";

    const scheduled = await createScheduledSocialPost({
      platform: "instagram",
      caption: "Fresh arrivals",
      imageUrl: "https://example.com/1.jpg",
      scheduledAt: new Date("2026-07-08T10:00:00.000Z").toISOString(),
      hashtags: "#beauty",
    });

    const due = await getDueSocialPosts(new Date("2026-07-08T10:30:00.000Z"));
    expect(due.some((post) => post.id === scheduled.id)).toBe(true);
    expect(due.find((post) => post.id === scheduled.id)?.status).toBe("scheduled");
  });

  it("marks a scheduled post as posted", async () => {
    process.env.SOCIAL_MEDIA_STORAGE_PATH = "/tmp/tbh-social-media-test-2.json";

    const scheduled = await createScheduledSocialPost({
      platform: "tiktok",
      caption: "Glow up",
      imageUrl: "https://example.com/2.jpg",
      scheduledAt: new Date("2026-07-08T12:00:00.000Z").toISOString(),
      hashtags: "#glow",
    });

    const updated = await markSocialPostStatus(scheduled.id, "posted", {
      externalId: "buffer-123",
    });

    expect(updated?.status).toBe("posted");
    expect(updated?.externalId).toBe("buffer-123");
  });
});
