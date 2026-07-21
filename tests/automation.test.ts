import { describe, expect, it } from "vitest";
import { buildInboundReply, buildEventMessage } from "../services/automation/logic";

describe("local automation logic", () => {
  it("builds a friendly inbound reply for a new customer", () => {
    const reply = buildInboundReply({ name: "Ada", message: "Hello" });

    expect(reply).toContain("Ada");
    expect(reply).toContain("Tams Beauty Hub");
  });

  it("builds a concise notification for a sale event", () => {
    const message = buildEventMessage("sale", {
      sale: {
        receiptNumber: "TBH-0001",
        totalAmount: 250000,
      },
    });

    expect(message).toContain("TBH-0001");
    expect(message).toContain("250000");
  });
});
