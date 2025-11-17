// @ts-nocheck
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { contactInfo, openingHours } from "@/features/marketing/site-content";

export const metadata: Metadata = {
  title: "Kontakt & Öffnungszeiten | Schnittwerk",
  description: "Adresse, Öffnungszeiten, Anreise und Kontaktkanäle des Salons in St. Gallen.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Kontakt</p>
        <h1 className="text-3xl font-semibold leading-tight text-ink">Erreichbarkeit & Anreise</h1>
        <p className="max-w-3xl text-sm text-muted">
          Öffnungszeiten, Adresse und Wegbeschreibung auf einen Blick. Alle Infos sind SEO-fähig und können für Rich Snippets
          genutzt werden.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/booking">Direkt zum Booking-Stub</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/services">Services ansehen</Link>
          </Button>
        </div>
      </div>

      <Card id="anreise" className="border-dashed border-border/70 shadow-sm">
        <CardHeader>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Adresse</p>
          <CardTitle className="text-2xl">{contactInfo.address}</CardTitle>
          <CardDescription className="text-sm text-muted">
            5 Minuten vom Marktplatz St. Gallen. DSG-konforme Kontaktkanäle, keine PII in Logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm text-muted">
            <p className="flex items-center gap-2 text-ink">
              <Badge variant="secondary">Telefon</Badge>
              <Link className="underline decoration-dotted underline-offset-4" href={`tel:${contactInfo.phone}`}>
                {contactInfo.phone}
              </Link>
            </p>
            <p className="flex items-center gap-2 text-ink">
              <Badge variant="secondary">E-Mail</Badge>
              <Link className="underline decoration-dotted underline-offset-4" href={`mailto:${contactInfo.email}`}>
                {contactInfo.email}
              </Link>
            </p>
            <p className="flex items-center gap-2 text-ink">
              <Badge variant="secondary">Karte</Badge>
              <Link className="underline decoration-dotted underline-offset-4" href={contactInfo.mapLink}>
                Google Maps öffnen
              </Link>
            </p>
            <ul className="space-y-2 pt-2 text-sm text-muted">
              {contactInfo.transport.map((hint) => (
                <li key={hint} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-accent-strong">Öffnungszeiten</p>
            <div className="grid gap-1 text-sm text-muted">
              {openingHours.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{entry.day}</span>
                  <span>{entry.value}</span>
                </div>
              ))}
            </div>
            <p className="rounded-lg border border-dashed border-border/70 bg-surface px-3 py-2 text-xs uppercase tracking-wide text-ink">
              Donnerstag Abendtermine aktiv. Für Feiertage folgt Phase-4-Override.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
