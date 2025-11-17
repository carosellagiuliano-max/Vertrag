import { differenceInMinutes, isAfter, isSameDay } from "date-fns";

export type BookingRuleContext = {
  minLeadTimeMinutes: number;
  maxAdvanceDays: number;
  openingHours: { startHour: number; endHour: number };
  existingSlots: { start: Date; end: Date }[];
};

export function isWithinOpeningHours(start: Date, end: Date, hours: { startHour: number; endHour: number }) {
  const startsTooEarly = start.getHours() < hours.startHour;
  const endsTooLate = end.getHours() >= hours.endHour && end.getMinutes() > 0;
  const crossDay = !isSameDay(start, end);
  return !(startsTooEarly || endsTooLate || crossDay);
}

export function hasOverlap(candidate: { start: Date; end: Date }, existing: { start: Date; end: Date }[]) {
  return existing.some((slot) => candidate.start < slot.end && candidate.end > slot.start);
}

export function validateBookingRules(slot: { start: Date; end: Date }, context: BookingRuleContext) {
  const reasons: string[] = [];
  const now = new Date();
  const leadTime = differenceInMinutes(slot.start, now);
  if (leadTime < context.minLeadTimeMinutes) {
    reasons.push("Lead-Time zu kurz – bitte späteren Slot wählen");
  }
  const advanceDays = differenceInMinutes(slot.start, now) / (60 * 24);
  if (advanceDays > context.maxAdvanceDays) {
    reasons.push("Slot liegt zu weit in der Zukunft");
  }
  if (!isWithinOpeningHours(slot.start, slot.end, context.openingHours)) {
    reasons.push("Slot liegt ausserhalb der Öffnungszeiten");
  }
  if (hasOverlap(slot, context.existingSlots)) {
    reasons.push("Slot überschneidet sich mit bestehender Buchung");
  }
  if (!isAfter(slot.end, slot.start)) {
    reasons.push("Endzeit muss nach Startzeit liegen");
  }
  if (!isAfter(slot.start, now)) {
    reasons.push("Slot darf nicht in der Vergangenheit liegen");
  }
  return { ok: reasons.length === 0, reasons };
}
