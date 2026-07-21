import { describe, expect, it } from "vitest";
import { buildSocialAnalyticsKpiRows } from "@/lib/utils/marketing/social-analytics";

describe("social analytics KPI rows", () => {
  it("builds rows for each platform and a pending-updates metric", () => {
    const now = new Date("2026-07-15T12:00:00.000Z");
    const rows = buildSocialAnalyticsKpiRows(
      {
        instagram: { posted: 3, scheduled: 1, failed: 0 },
        tiktok: { posted: 2, scheduled: 0, failed: 1 },
        youtube: { posted: 1, scheduled: 2, failed: 0 },
        pendingUpdates: 3,
      },
      now,
    );

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      metricName: "instagram_posts_published",
      metricValue: 3,
      platform: "instagram",
    });
    expect(rows[3]).toMatchObject({
      metricName: "social_pending_updates",
      metricValue: 3,
      platform: "overall",
    });
  });
});
