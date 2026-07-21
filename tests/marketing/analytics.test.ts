import { describe, expect, it } from "vitest";
import { getMarketingHealthScore } from "@/lib/utils/marketing";

describe("getMarketingHealthScore", () => {
  it("rewards completed campaigns, converted leads, and active broadcasts", () => {
    const score = getMarketingHealthScore({
      campaigns: [{ status: "completed" }, { status: "active" }],
      leads: [{ status: "converted" }, { status: "new" }],
      broadcasts: [{ status: "sent" }, { status: "draft" }],
      testimonials: [{ status: "featured" }, { status: "pending_approval" }],
      referrals: [{ status: "completed" }, { status: "pending" }],
      kpis: [{ metricValue: 120, targetValue: 100 }],
    });

    expect(score.score).toBeGreaterThan(50);
    expect(score.breakdown).toMatchObject({
      campaigns: 2,
      leads: 1,
      broadcasts: 1,
      testimonials: 1,
      referrals: 1,
      kpis: 1,
    });
  });
});
