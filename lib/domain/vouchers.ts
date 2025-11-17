export type Voucher = {
  code: string;
  amountChf: number;
  expiresAt: Date;
  redeemed: boolean;
};

export function redeemVoucher(voucher: Voucher, orderTotal: number, now = new Date()) {
  if (voucher.redeemed) {
    return { ok: false, remaining: orderTotal, reason: "Gutschein bereits eingelöst" };
  }
  if (now > voucher.expiresAt) {
    return { ok: false, remaining: orderTotal, reason: "Gutschein abgelaufen" };
  }
  if (orderTotal <= 0) {
    return { ok: false, remaining: orderTotal, reason: "Bestellsumme muss grösser 0 sein" };
  }
  const applied = Math.min(orderTotal, voucher.amountChf);
  const remaining = Number((orderTotal - applied).toFixed(2));
  return { ok: true, remaining, applied, reason: null as string | null };
}
