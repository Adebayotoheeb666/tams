import { describe, expect, it } from "vitest";
import { buildFollowUpDateForLead, calculateBroadcastPerformance, calculateLeadScore } from "@/lib/utils/marketing";

describe("calculateLeadScore", () => {
  it("awards higher scores to referrals and detailed enquiries", () => {
    const score = calculateLeadScore({
      source: "referral",
      initialMessage: "I am looking for a bridal glow service for my event next weekend.",
      interestedIn: ["thrift", "nails"],
    });

    expect(score).toBeGreaterThan(50);
  });
});

describe("buildFollowUpDateForLead", () => {
  it("creates a follow-up date for new leads", () => {
    const followUpDate = buildFollowUpDateForLead(new Date("2026-07-15T10:00:00.000Z"));
    expect(followUpDate).toBe("2026-07-17T10:00:00.000Z");
  });
});

describe("calculateBroadcastPerformance", () => {
  it("returns delivery and engagement ratios for broadcast performance", () => {
    const summary = calculateBroadcastPerformance({ totalRecipients: 100, sentCount: 80, readCount: 40, clickCount: 8 });

    expect(summary.deliveryRate).toBe(80);
    expect(summary.readRate).toBe(50);
    expect(summary.clickRate).toBe(10);
  });
});
