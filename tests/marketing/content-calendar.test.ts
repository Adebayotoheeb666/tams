import { describe, expect, it } from "vitest";
import { normalizeContentPostInput } from "../../lib/utils/marketing/content-calendar";

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
});
