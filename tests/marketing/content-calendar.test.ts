import { describe, expect, it } from "vitest";
import { normalizeContentPostInput } from "../../lib/utils/marketing/content-calendar";
import { createContentPostSchema } from "../../lib/validations/marketing";

describe("content calendar input normalization", () => {
  it("stores uploaded media as a database-safe content reference", async () => {
    const file = new File(["hello-world"], "sample.png", { type: "image/png" });

    const result = await normalizeContentPostInput({
      platform: "instagram",
      contentType: "product_showcase",
      title: "New launch",
      caption: "Fresh content",
      contentUrl: "https://example.com/legacy.jpg",
      contentFile: file,
      scheduledDate: "2026-07-22",
      hashtags: ["#beauty"],
      targetAudience: "VIP clients",
      callToAction: "Book now",
    });

    expect(result.contentUrl).toContain("data:image/png;base64,");
  });

  it("normalizes empty campaignId values to undefined", () => {
    const validated = createContentPostSchema.parse({
      campaignId: "  ",
      platform: "instagram",
      contentType: "behind_the_scenes",
      title: "Behind the scenes: new nail set",
      contentUrl: "https://example.com/sample.png",
    });

    expect(validated.campaignId).toBeUndefined();
  });
});
