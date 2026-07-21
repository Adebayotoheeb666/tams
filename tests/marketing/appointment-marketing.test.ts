import { describe, expect, it } from "vitest";
import {
  buildAppointmentMessage,
  getAppointmentMarketingSegment,
  normalizeWhatsappNumber,
} from "@/lib/utils/marketing/appointment-marketing";

describe("appointment marketing helpers", () => {
  it("normalizes local WhatsApp numbers", () => {
    expect(normalizeWhatsappNumber("08012345678")).toBe("+2348012345678");
    expect(normalizeWhatsappNumber("+2348012345678")).toBe("+2348012345678");
  });

  it("assigns VIP segment for high-value appointments", () => {
    expect(getAppointmentMarketingSegment(25000)).toBe("vip");
    expect(getAppointmentMarketingSegment(8000)).toBe("new_customer");
  });

  it("builds confirmation and reminder messages", () => {
    const confirmation = buildAppointmentMessage("confirmation", {
      customerName: "Ada",
      appointmentDate: "2026-07-20",
      appointmentTime: "14:00",
      serviceName: "Gel Polish",
    });

    const reminder = buildAppointmentMessage("reminder", {
      customerName: "Ada",
      appointmentDate: "2026-07-20",
      appointmentTime: "14:00",
      serviceName: "Gel Polish",
    });

    expect(confirmation).toContain("Ada");
    expect(confirmation).toContain("Gel Polish");
    expect(reminder).toContain("Reminder");
  });
});
