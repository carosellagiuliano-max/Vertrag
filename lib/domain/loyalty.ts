export type LoyaltyTier = "standard" | "silver" | "gold";

export function calculateLoyaltyPoints(amountChf: number, tier: LoyaltyTier) {
  if (amountChf <= 0) return 0;
  const base = Math.floor(amountChf);
  const multiplier = tier === "gold" ? 1.5 : tier === "silver" ? 1.2 : 1;
  return Math.round(base * multiplier);
}

export function qualifyForUpgrade(visitsLast90Days: number, totalSpendChf: number): LoyaltyTier {
  if (visitsLast90Days >= 8 || totalSpendChf >= 1500) return "gold";
  if (visitsLast90Days >= 4 || totalSpendChf >= 800) return "silver";
  return "standard";
}
