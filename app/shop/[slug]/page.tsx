import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductBySlug } from "@/features/shop/shop-service";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "../add-to-cart-button";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  return {
    title: product ? `${product.name} | Schnittwerk` : "Produkt | Schnittwerk",
  };
}

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg">Nicht gefunden</CardTitle>
          <CardDescription className="text-muted">Das Produkt ist nicht verfügbar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/shop">Zur Übersicht</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_0.8fr]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-2xl text-ink">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted">{product.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted">
          <div className="flex flex-wrap gap-2">
            {product.badges?.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
          <p>Geeignet für Pflege zuhause nach Farbdienstleistungen, inklusive Bonding und Hitzeschutz.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>EU-konforme Inhaltsstoffe, keine versteckten Cloud-Aufrufe</li>
            <li>SKU gepflegt in Supabase, Lagerstand und Preis als Single Source of Truth</li>
            <li>Kann in Admin-Phase um Varianten und Bundles erweitert werden</li>
          </ul>
          <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-sm text-muted">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Checkout-Pfad</p>
            <p>Warenkorb speichert im Cookie. Checkout schreibt Orders + Items in Supabase oder Demo-Store.</p>
            <p className="text-xs text-muted">Stripe-Testkasse wird genutzt, wenn STRIPE_SECRET_KEY gesetzt ist.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit border-border/70">
        <CardHeader>
          <CardTitle className="text-xl text-ink">{formatCurrency(product.priceChf)}</CardTitle>
          <CardDescription className="text-sm text-muted">
            {product.stock > 0 ? `${product.stock} Stück auf Lager` : "Aktuell nicht verfügbar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {product.stock > 0 ? <AddToCartButton productId={product.id} /> : <Badge variant="outline">Warteliste</Badge>}
          <div className="flex items-center gap-2 text-xs text-muted">
            <Badge variant="muted">Abholung im Salon</Badge>
            <Badge variant="outline">CHF</Badge>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/checkout">Zum Checkout</Link>
          </Button>
          <Button asChild variant="link" className="w-full px-0">
            <Link href="/shop">Weitere Produkte</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
