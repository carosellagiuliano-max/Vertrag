// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { checkoutAction, type CheckoutState } from "./actions";

export function CheckoutForm({ totalFormatted }: { totalFormatted: string }) {
  const [state, formAction] = useFormState<CheckoutState>(checkoutAction, { ok: false });

  useEffect(() => {
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state?.redirectUrl]);

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-xl text-ink">Checkout</CardTitle>
        <CardDescription className="text-sm text-muted">
          Bezahle sicher via Stripe-Testkasse oder Demo-Flow. Summe: {totalFormatted}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4 text-sm text-muted">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="name">
                Name
              </label>
              <Input id="name" name="name" placeholder="Alex Muster" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="email">
                E-Mail
              </label>
              <Input id="email" name="email" type="email" required placeholder="kunde@example.ch" />
            </div>
          </div>
          <p className="text-xs text-muted">Die Bestellung wird deinem Portal-Konto zugeordnet.</p>
          <Button type="submit">Jetzt bezahlen</Button>
          {state?.message ? (
            <p className={`text-xs ${state.ok ? "text-ink" : "text-destructive"}`}>{state.message}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            <Badge>Stripe test</Badge>
            <Badge variant="outline">RLS</Badge>
            <Badge variant="muted">Portal sichtbar</Badge>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
