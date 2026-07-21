import { describe, expect, it } from "vitest";
import { normalizeAutomationSettingValue } from "@/lib/utils/marketing/automation-settings";

describe("automation setting normalization", () => {
  it("maps boolean-like input to persisted values", () => {
    expect(normalizeAutomationSettingValue("on", "boolean")).toBe("1");
    expect(normalizeAutomationSettingValue("", "boolean")).toBe("0");
  });

  it("preserves numeric values", () => {
    expect(normalizeAutomationSettingValue("24", "number")).toBe("24");
  });
});
