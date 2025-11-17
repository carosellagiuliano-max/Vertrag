import Link from "next/link";
import { DesignSystemShowcase } from "@/components/design-system-showcase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { contactInfo, heroCopy, openingHours, services } from "@/features/marketing/site-content";

const highlights = [
  {
    title: "Live Öffnungszeiten",
    description: "Aktuelle Zeiten mit Abend-Slots am Donnerstag – bereit für SEO und Slot-Widgets.",
  },
  {
    title: "Shop & Lager",
    description: "Produkte mit Lagerstand, Warenkorb und Checkout via Stripe-Testkasse oder Demo-Modus.",
  },
  {
    title: "Booking & Portal",
    description: "Konto + Slot-Buchung, Portal mit Terminen und Bestellungen – alles RLS-fähig.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-10">
      <Card id="hero" className="shadow-surface">
        <CardContent className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <Badge>Phase 5</Badge>
              <Badge variant="muted">Shop</Badge>
              <Badge variant="outline">Checkout</Badge>
            </div>
            <CardTitle className="text-3xl md:text-4xl">{heroCopy.title}</CardTitle>
            <CardDescription className="text-base text-muted">{heroCopy.summary}</CardDescription>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-accent-strong">
              <span className="rounded-full bg-accent/10 px-3 py-1 text-ink">St. Gallen</span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-ink">CH/EU Datenschutz</span>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-ink">Portal + Booking + Shop</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {heroCopy.ctas.map((cta) => (
                <Button key={cta.href} asChild size="lg" variant={cta.label.includes("buchen") ? "default" : "secondary"}>
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <Card className="border-dashed border-border/70 bg-surface">
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between text-ink">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted">Fokus</p>
                <Badge variant="success">live</Badge>
              </div>
              <div className="grid gap-3 text-sm text-muted">
                {highlights.map((highlight) => (
                  <div key={highlight.title} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                    <p className="text-xs uppercase tracking-wide text-accent-strong">{highlight.title}</p>
                    <p className="text-ink">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div id="services" className="grid gap-4 md:grid-cols-3">
        {services.slice(0, 3).map((service) => (
          <Card key={service.id} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                <CardTitle className="text-lg">{service.name}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted">{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3 text-sm text-muted">
              <div className="flex items-center gap-3 text-ink">
                <Badge variant="secondary">{service.category}</Badge>
                <span>{service.durationMinutes} Min</span>
                <span className="font-semibold text-ink">{service.price}</span>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Card id="oeffnungszeiten">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Öffnungszeiten</p>
            <CardTitle className="text-2xl">Aktuelle Slots</CardTitle>
            <CardDescription>Donnerstag mit Abendterminen, Samstag verkürzte Slots – ideal für Booking-Widgets.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/contact#anreise">Anreise & Kontakt</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-2xl border border-border/70 bg-surface p-4 shadow-sm">
            {openingHours.map((entry) => (
              <div key={entry.day} className="flex items-center justify-between text-sm text-muted">
                <span className="font-semibold text-ink">{entry.day}</span>
                <span>{entry.value}</span>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-accent-strong">Kontakt</p>
            <p className="text-sm text-ink">{contactInfo.address}</p>
            <div className="flex flex-wrap gap-3 text-sm text-muted">
              <Link className="underline decoration-dotted underline-offset-4" href={`tel:${contactInfo.phone}`}>
                {contactInfo.phone}
              </Link>
              <Link className="underline decoration-dotted underline-offset-4" href={`mailto:${contactInfo.email}`}>
                {contactInfo.email}
              </Link>
              <Link className="underline decoration-dotted underline-offset-4" href={contactInfo.mapLink}>
                Karte öffnen
              </Link>
            </div>
            <ul className="space-y-2 text-sm text-muted">
              {contactInfo.transport.map((hint) => (
                <li key={hint} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card id="booking">
        <CardContent className="grid gap-6 md:grid-cols-[1.6fr_1fr] md:gap-10">
          <div className="space-y-3">
            <CardTitle className="text-xl">Booking, Portal & Shop</CardTitle>
            <CardDescription className="text-sm text-muted">
              Phase 5 ergänzt Warenkorb + Checkout zum bestehenden Booking-Flow. Account-Felder, Slot-Buchung und Shop landen
              in Supabase, bis Keys fehlen greift der Demo-Speicher.
            </CardDescription>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/booking">Jetzt buchen</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/portal">Zum Portal</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-border/70 bg-surface p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted">Flow Vorschau</p>
            <p className="text-sm text-ink">Echte Server Action + Portal-Update.</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                <span className="font-semibold text-ink">Signature Cut & Style</span> · 60 Min · CHF 120
              </div>
              <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                <span className="font-semibold text-ink">Slot</span>: Do 17:00 · bestätigt
              </div>
              <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                <span className="font-semibold text-ink">Portal</span>: Termin sichtbar &amp; stornierbar
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div id="designsystem" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Designsystem</p>
            <CardTitle className="text-xl">Phase-2-Komponenten im Einsatz</CardTitle>
          </div>
          <Button asChild variant="secondary">
            <Link href="#hero">Nach oben</Link>
          </Button>
        </div>
        <DesignSystemShowcase />
      </div>
    </div>
  );
}
