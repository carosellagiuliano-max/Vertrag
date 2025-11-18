// @ts-nocheck
"use server";

import { z } from "zod";
import { getCart, placeOrder } from "@/features/shop/shop-service";
import Stripe from "stripe";
import { env, hasStripeConfig } from "@/lib/config/env";

export type CheckoutState = { ok: boolean; message?: string; redirectUrl?: string; orderId?: string };

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80).optional(),
});

export async function checkoutAction(_: CheckoutState | undefined, formData: FormData): Promise<CheckoutState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Ungültige Eingabe" };
  }

  const cart = getCart();
  if (!cart.length) {
    return { ok: false, message: "Warenkorb leer" };
  }

  const result = await placeOrder({ email: parsed.data.email, name: parsed.data.name, lines: cart });
  
  // If Stripe session created, redirect immediately
  if (result.redirectUrl) {
    return result;
  }

  return result;
}
