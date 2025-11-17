import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listProducts } from "@/features/shop/shop-service";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

export const metadata = {
  title: "Shop | Schnittwerk",
};

export default async function ShopPage() {
  const products = await listProducts();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Phase 5 · Shop</p>
        <h1 className="text-3xl font-semibold text-ink">Salon-Exklusives Sortiment mit Checkout</h1>
        <p className="max-w-3xl text-sm text-muted">
          Produkte mit Lagerstand, Warenkorb und Stripe-Testkasse. Läuft mit Supabase oder im Demo-Speicher, damit Checkout
          und Portal-Bestellungen sofort greifbar sind.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          <Badge>Warenkorb</Badge>
          <Badge variant="outline">Stripe ready</Badge>
          <Badge variant="muted">RLS</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <Card key={product.id} className="h-full border-border/70">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl text-ink">
                  <Link href={`/shop/${product.slug}`} className="hover:underline">
                    {product.name}
                  </Link>
                </CardTitle>
                <CardDescription className="text-sm text-muted">{product.description}</CardDescription>
                <div className="flex flex-wrap gap-2">
                  {product.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="text-lg font-semibold text-ink">{formatCurrency(product.priceChf)}</p>
                <Badge variant={product.stock > 0 ? "success" : "outline"}>
                  {product.stock > 0 ? `${product.stock} auf Lager` : "Ausverkauft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 border-t border-border/60 pt-4 text-sm text-muted">
              <div className="flex items-center gap-3">
                <Button asChild variant="link" className="px-0">
                  <Link href={`/shop/${product.slug}`}>Details</Link>
                </Button>
                <Badge variant="muted">CHF</Badge>
              </div>
              {product.stock > 0 ? <AddToCartButton productId={product.id} /> : <Badge variant="outline">Warteliste</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle>Checkout & Portal</CardTitle>
          <CardDescription className="text-sm text-muted">
            Bestellungen landen in Supabase (orders & order_items) oder im Demo-Speicher. Portal zeigt sie neben Terminen an.
            Stripe-Testkasse optional über STRIPE_SECRET_KEY.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/checkout">Zum Checkout</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/portal">Portal öffnen</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
