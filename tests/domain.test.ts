import { addMinutes, differenceInMinutes, isAfter, isSameDay, subDays } from "date-fns";
import { describe, expect, test } from "vitest";
import {
  hasOverlap,
  isWithinOpeningHours,
  validateBookingRules,
  type BookingRuleContext,
} from "../lib/domain/booking-rules";
import { calculateLoyaltyPoints, qualifyForUpgrade, type LoyaltyTier } from "../lib/domain/loyalty";
import {
  prepareNotificationPayload,
  validateTemplate,
  type TemplateKey,
} from "../lib/domain/notifications";
import type { Voucher } from "../lib/domain/vouchers";
import { redeemVoucher } from "../lib/domain/vouchers";

describe("booking rules", () => {
  const baseContext: BookingRuleContext = {
    minLeadTimeMinutes: 60,
    maxAdvanceDays: 30,
    openingHours: { startHour: 9, endHour: 18 },
    existingSlots: [],
  };

  test("isWithinOpeningHours rejects early start", () => {
    const slot = { start: new Date(2000, 0, 1, 8, 0), end: new Date(2000, 0, 1, 9, 0) };
    expect(isWithinOpeningHours(slot.start, slot.end, baseContext.openingHours)).toBe(false);
  });

  test("isWithinOpeningHours rejects late end", () => {
    const slot = { start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 18, 1) };
    expect(isWithinOpeningHours(slot.start, slot.end, baseContext.openingHours)).toBe(false);
  });

  test("isWithinOpeningHours rejects cross-day", () => {
    const start = new Date(2000, 0, 1, 17, 0);
    const end = new Date(2000, 0, 2, 10, 0);
    expect(isWithinOpeningHours(start, end, baseContext.openingHours)).toBe(false);
  });

  test("isWithinOpeningHours accepts valid", () => {
    const slot = { start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 17, 0) };
    expect(isWithinOpeningHours(slot.start, slot.end, baseContext.openingHours)).toBe(true);
  });

  test("hasOverlap detects full overlap", () => {
    const candidate = { start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 12, 0) };
    const existing = [{ start: new Date(2000, 0, 1, 9, 0), end: new Date(2000, 0, 1, 13, 0) }];
    expect(hasOverlap(candidate, existing)).toBe(true);
  });

  test("hasOverlap detects partial overlap start", () => {
    const candidate = { start: new Date(2000, 0, 1, 11, 0), end: new Date(2000, 0, 1, 12, 0) };
    const existing = [{ start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 11, 30) }];
    expect(hasOverlap(candidate, existing)).toBe(true);
  });

  test("hasOverlap detects partial overlap end", () => {
    const candidate = { start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 11, 30) };
    const existing = [{ start: new Date(2000, 0, 1, 11, 0), end: new Date(2000, 0, 1, 12, 0) }];
    expect(hasOverlap(candidate, existing)).toBe(true);
  });

  test("hasOverlap no overlap", () => {
    const candidate = { start: new Date(2000, 0, 1, 13, 0), end: new Date(2000, 0, 1, 14, 0) };
    const existing = [{ start: new Date(2000, 0, 1, 10, 0), end: new Date(2000, 0, 1, 12, 0) }];
    expect(hasOverlap(candidate, existing)).toBe(false);
  });

  test("validateBookingRules rejects short lead time", () => {
    const now = new Date();
    const slot = { start: new Date(now.getTime() + 30 * 60 * 1000), end: new Date(now.getTime() + 90 * 60 * 1000) };
    const result = validateBookingRules(slot, baseContext);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Lead-Time zu kurz – bitte späteren Slot wählen");
  });

  test("validateBookingRules rejects too far advance", () => {
    const now = new Date();
    const farFuture = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);
    const slot = { start: farFuture, end: addMinutes(farFuture, 60) };
    const result = validateBookingRules(slot, baseContext);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Slot liegt zu weit in der Zukunft");
  });

  test("validateBookingRules rejects out of hours", () => {
    const slot = { start: new Date(2000, 0, 1, 8, 0), end: new Date(2000, 0, 1, 10, 0) };
    const result = validateBookingRules(slot, baseContext);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Slot liegt ausserhalb der Öffnungszeiten");
  });

  test("validateBookingRules rejects overlap", () => {
    const now = new Date();
    const slot = { start: addMinutes(now, 70), end: addMinutes(now, 130) };
    const context = { ...baseContext, existingSlots: [{ start: addMinutes(now, 80), end: addMinutes(now, 120) }] };
    const result = validateBookingRules(slot, context);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Slot überschneidet sich mit bestehender Buchung");
  });

  test("validateBookingRules rejects end before start", () => {
    const slot = { start: new Date(2000, 0, 1, 12, 0), end: new Date(2000, 0, 1, 11, 0) };
    const result = validateBookingRules(slot, baseContext);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Endzeit muss nach Startzeit liegen");
  });

  test("validateBookingRules rejects past slot", () => {
    const past = new Date(2000, 0, 1, 10, 0);
    const slot = { start: past, end: addMinutes(past, 60) };
    const result = validateBookingRules(slot, baseContext);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("Slot darf nicht in der Vergangenheit liegen");
  });

  test("validateBookingRules accepts fully valid", () => {
    const now = new Date();
    const validStart = new Date(now.getTime() + 70 * 60 * 1000);
    const slot = { start: validStart, end: addMinutes(validStart, 60) };
    const context = { ...baseContext, existingSlots: [], minLeadTimeMinutes: 0, maxAdvanceDays: 90 };
    const result = validateBookingRules(slot, context);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });
});

describe("loyalty", () => {
  test("qualifyForUpgrade boundaries", () => {
    expect(qualifyForUpgrade(0, 0)).toBe("standard");
    expect(qualifyForUpgrade(3, 799)).toBe("standard");
    expect(qualifyForUpgrade(4, 0)).toBe("silver");
    expect(qualifyForUpgrade(3, 800)).toBe("silver");
    expect(qualifyForUpgrade(7, 1499)).toBe("silver");
    expect(qualifyForUpgrade(8, 0)).toBe("gold");
    expect(qualifyForUpgrade(0, 1500)).toBe("gold");
  });

  test("calculateLoyaltyPoints zero/negative", () => {
    expect(calculateLoyaltyPoints(0, "standard")).toBe(0);
    expect(calculateLoyaltyPoints(-10, "gold")).toBe(0);
  });

  test("calculateLoyaltyPoints rounding/multipliers", () => {
    expect(calculateLoyaltyPoints(100.5, "standard")).toBe(100);
    expect(calculateLoyaltyPoints(100.5, "silver")).toBe(121); // 100 * 1.2 = 120, round(120.6)=121?
    expect(calculateLoyaltyPoints(100.5, "gold")).toBe(151); // 100 * 1.5 = 150, round(150.75)=151
    expect(calculateLoyaltyPoints(1, "gold")).toBe(2);
  });
});

describe("vouchers", () => {
  const baseVoucher: Voucher = {
    code: "TEST",
    amountChf: 50,
    expiresAt: new Date(Date.now() + 3600000),
    redeemed: false,
  };

  test("redeemVoucher rejects redeemed", () => {
    const voucher = { ...baseVoucher, redeemed: true };
    const result = redeemVoucher(voucher, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gutschein bereits eingelöst");
  });

  test("redeemVoucher rejects expired", () => {
    const voucher = { ...baseVoucher, expiresAt: new Date(Date.now() - 1000) };
    const result = redeemVoucher(voucher, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Gutschein abgelaufen");
  });

  test("redeemVoucher rejects orderTotal <=0", () => {
    const result = redeemVoucher(baseVoucher, 0);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("Bestellsumme muss grösser 0 sein");
    const negResult = redeemVoucher(baseVoucher, -10);
    expect(negResult.ok).toBe(false);
    expect(negResult.reason).toBe("Bestellsumme muss grösser 0 sein");
  });

  test("redeemVoucher caps at order total, precision", () => {
    const voucher = { ...baseVoucher, amountChf: 120.99 };
    const result = redeemVoucher(voucher, 80.50);
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(80.50);
    expect(result.remaining).toBe(0);
  });

  test("redeemVoucher partial use leaves remaining", () => {
    const voucher = { ...baseVoucher, amountChf: 30 };
    const result = redeemVoucher(voucher, 50);
    expect(result.ok).toBe(true);
    expect(result.applied).toBe(30);
    expect(result.remaining).toBe(20);
  });
});

describe("notifications", () => {
  test("validateTemplate all allowed/invalid", () => {
    expect(validateTemplate("booking_confirmation")).toBe(true);
    expect(validateTemplate("cancellation")).toBe(true);
    expect(validateTemplate("order_receipt")).toBe(true);
    expect(validateTemplate("invalid")).toBe(false);
    expect(validateTemplate("" as TemplateKey)).toBe(false);
  });

  test("prepareNotificationPayload full vars ok", () => {
    const booking = prepareNotificationPayload("booking_confirmation", {
      customerName: "Max Mustermann",
      appointmentTime: "2025-01-01 10:00",
    });
    expect(booking.ok).toBe(true);
    expect(booking.payload).toEqual({
      template: "booking_confirmation",
      variables: { customerName: "Max Mustermann", appointmentTime: "2025-01-01 10:00" },
    });

    const cancel = prepareNotificationPayload("cancellation", {
      customerName: "Max Mustermann",
      appointmentTime: "2025-01-01 10:00",
    });
    expect(cancel.ok).toBe(true);

    const receipt = prepareNotificationPayload("order_receipt", {
      customerName: "Max Mustermann",
      orderNumber: "ORD-123",
      total: "CHF 150.00",
    });
    expect(receipt.ok).toBe(true);
  });

  test("prepareNotificationPayload missing single var", () => {
    const missingTime = prepareNotificationPayload("booking_confirmation", {
      customerName: "Max",
      // missing appointmentTime
    });
    expect(missingTime.ok).toBe(false);
    expect(missingTime.missing).toEqual(["appointmentTime"]);

    const missingTotal = prepareNotificationPayload("order_receipt", {
      customerName: "Max",
      orderNumber: "123",
      // missing total
    });
    expect(missingTotal.ok).toBe(false);
    expect(missingTotal.missing).toEqual(["total"]);
  });

  test("prepareNotificationPayload missing multiple vars", () => {
    const missingBoth = prepareNotificationPayload("order_receipt", { customerName: "Max" });
    expect(missingBoth.ok).toBe(false);
    expect(missingBoth.missing).toEqual(["orderNumber", "total"]);
  });
});
