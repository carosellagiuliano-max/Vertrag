import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCartDetails } from "@/features/shop/shop-service";
import { formatCurrency } from "@/lib/utils";
import { removeFromCartAction } from "../shop/actions";
import { CheckoutForm } from "./checkout-form";

export const metadata = {
  title: "Checkout | Schnittwerk",
};

export default async function CheckoutPage() {
  const cart = await getCartDetails();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Phase 5 · Checkout</p>
        <h1 className="text-3xl font-semibold text-ink">Warenkorb mit Stripe-Testkasse</h1>
        <p className="max-w-3xl text-sm text-muted">
          Produkte landen im Warenkorb (Cookie-basiert), der Checkout validiert Lagerstand und legt Bestellungen in Supabase
          oder im Demo-Store an. Portal zeigt Bestellungen neben Terminen.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          <Badge>Orders</Badge>
          <Badge variant="outline">Stock</Badge>
          <Badge variant="muted">Stripe optional</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Warenkorb</CardTitle>
            <CardDescription className="text-sm text-muted">{cart.lines.length} Positionen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.lines.length === 0 ? (
              <div className="space-y-3 text-sm text-muted">
                <p>Noch nichts im Warenkorb.</p>
                <Button asChild>
                  <Link href="/shop">Zum Shop</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.lines.map((line) => (
                  <div
                    key={line.productId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-ink">{line.product?.name}</p>
                      <p className="text-xs text-muted">{line.quantity} × {formatCurrency(line.product?.priceChf ?? 0)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{formatCurrency(line.lineTotal)}</Badge>
                      <form
                        action={async () => {
                          "use server";
                          await removeFromCartAction(line.productId);
                        }}
                      >
                        <Button type="submit" variant="ghost" size="sm">
                          Entfernen
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/70 p-4">
                  <span className="text-sm font-semibold text-ink">Summe</span>
                  <span className="text-lg font-semibold text-ink">{formatCurrency(cart.total)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <CheckoutForm totalFormatted={formatCurrency(cart.total)} />
      </div>
    </div>
  );
}
