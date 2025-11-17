import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/features/marketing/site-content";

export const metadata: Metadata = {
  title: "Leistungen | Schnittwerk",
  description: "Signature Cuts, Color & Glow, Treatments und Express-Styling mit klaren Preisen.",
};

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Services</p>
        <h1 className="text-3xl font-semibold leading-tight text-ink">Was wir anbieten</h1>
        <p className="max-w-3xl text-sm text-muted">
          Klare Leistungen mit Dauer und Preis. Alle Services sind auf mehrsprachige Beratung vorbereitet und berücksichtigen
          Datenschutz sowie Barrierefreiheit.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/booking">Buchungs-Einstieg</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact#anreise">Kontakt &amp; Anreise</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{service.category}</Badge>
                <CardTitle className="text-xl">{service.name}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted">{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <div className="flex items-center gap-4 text-ink">
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
                  {service.durationMinutes} Min
                </span>
                <span className="font-semibold">{service.price}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="rounded-xl border border-dashed border-border/70 bg-card px-4 py-3 text-xs uppercase tracking-wide text-accent-strong">
                Termin wird erst mit Phase 4 gebucht – Services sind heute schon sichtbar.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
