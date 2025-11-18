import { addMinutes } from "date-fns";
import { describe, expect, test } from "vitest";
import { hasOverlap, isWithinOpeningHours, validateBookingRules } from "../lib/domain/booking-rules";
import { calculateLoyaltyPoints, qualifyForUpgrade } from "../lib/domain/loyalty";
import { prepareNotificationPayload, validateTemplate } from "../lib/domain/notifications";
import { redeemVoucher } from "../lib/domain/vouchers";

describe("booking rules", () => {
  test("rejects overlapping slots and out-of-hours bookings", () => {
    const now = new Date();
    const slot = { start: addMinutes(now, 30), end: addMinutes(now, 90) };
    const context = {
      minLeadTimeMinutes: 60,
      maxAdvanceDays: 30,
      openingHours: { startHour: 9, endHour: 18 },
      existingSlots: [{ start: addMinutes(now, 20), end: addMinutes(now, 80) }],
    };
    const result = validateBookingRules(slot, context);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Lead-Time zu kurz – bitte späteren Slot wählen");
    expect(result.reasons).toContain("Slot überschneidet sich mit bestehender Buchung");
  });

  test("accepts valid slot inside business hours", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow.setHours(10, 0, 0, 0));
    const slot = { start, end: addMinutes(start, 60) };
    const result = validateBookingRules(slot, {
      minLeadTimeMinutes: 0,
      maxAdvanceDays: 30,
      openingHours: { startHour: 9, endHour: 19 },
      existingSlots: [],
    });
    expect(result.ok).toBe(true);
    expect(isWithinOpeningHours(slot.start, slot.end, { startHour: 9, endHour: 19 })).toBe(true);
    expect(hasOverlap(slot, [])).toBe(false);
  });
});

describe("vouchers", () => {
  test("prevent double redemption and expiry", () => {
    const expiredVoucher = {
      code: "XMAS",
      amountChf: 50,
      expiresAt: new Date(Date.now() - 1000),
      redeemed: false,
    };
    expect(redeemVoucher(expiredVoucher, 80).ok).toBe(false);

    const usedVoucher = { ...expiredVoucher, expiresAt: new Date(Date.now() + 1000 * 60 * 60), redeemed: true };
    const redemption = redeemVoucher(usedVoucher, 40);
    expect(redemption.ok).toBe(false);
    expect(redemption.reason).toBe("Gutschein bereits eingelöst");
  });

  test("caps voucher at order total", () => {
    const voucher = {
      code: "NY2025",
      amountChf: 120,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      redeemed: false,
    };
    const redemption = redeemVoucher(voucher, 80);
    expect(redemption.ok).toBe(true);
    expect(redemption.applied).toBe(80);
    expect(redemption.remaining).toBe(0);
  });
});

describe("loyalty", () => {
  test("calculates tier upgrades by visits and spend", () => {
    expect(qualifyForUpgrade(1, 100)).toBe("standard");
    expect(qualifyForUpgrade(5, 200)).toBe("silver");
    expect(qualifyForUpgrade(2, 2000)).toBe("gold");
  });

  test("awards multiplier per tier", () => {
    expect(calculateLoyaltyPoints(100, "standard")).toBe(100);
    expect(calculateLoyaltyPoints(100, "silver")).toBe(120);
    expect(calculateLoyaltyPoints(100, "gold")).toBe(150);
  });
});

describe("notifications", () => {
  test("validates templates and required variables", () => {
    expect(validateTemplate("booking_confirmation")).toBe(true);
    expect(validateTemplate("unknown" as string)).toBe(false);

    const payload = prepareNotificationPayload("booking_confirmation", { customerName: "A", appointmentTime: "12:00" });
    expect(payload.ok).toBe(true);

    const missing = prepareNotificationPayload("order_receipt", { customerName: "A", orderNumber: "123" });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.missing).toContain("total");
    }
  });
});
