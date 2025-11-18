// @ts-nocheck
"use client";

import { useFormState } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "./actions";

export function AddToCartButton({ productId }: { productId: string }) {
  const [state, formAction] = useFormState(addToCartAction, { ok: false });

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value={1} />
      <Button type="submit" size="sm">
        In den Warenkorb
      </Button>
      {state?.message ? <Badge variant={state.ok ? "success" : "destructive"}>{state.message}</Badge> : null}
    </form>
  );
}
