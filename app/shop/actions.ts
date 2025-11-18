// @ts-nocheck
"use server";

import { z } from "zod";
import { addToCart, getCart, removeFromCart } from "@/features/shop/shop-service";

type CartState = { ok: boolean; message?: string };

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
});

export async function addToCartAction(_: CartState | undefined, formData: FormData): Promise<CartState> {
  const parsed = addSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Ungültige Eingabe" };
  }

  addToCart(getCart(), parsed.data);
  return { ok: true, message: "Zum Warenkorb hinzugefügt" };
}

export async function removeFromCartAction(productId: string) {
  if (!productId) return { ok: false, message: "Fehlt" };
  removeFromCart(getCart(), productId);
  return { ok: true, message: "Entfernt" };
}
