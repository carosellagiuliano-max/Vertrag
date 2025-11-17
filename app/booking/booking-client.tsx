"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { addMinutes } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { services } from "@/features/marketing/site-content";
import { bookAppointmentAction } from "./actions";

const slotOptions = [
  "2025-01-10T10:00:00+01:00",
  "2025-01-10T11:30:00+01:00",
  "2025-01-11T09:30:00+01:00",
  "2025-01-11T13:00:00+01:00",
];

export function BookingClient() {
  const [selectedService, setSelectedService] = useState<string>(services[0]?.id ?? "");
  const [selectedSlot, setSelectedSlot] = useState<string>(slotOptions[0]);
  const [formState, setFormState] = useState<{ ok?: boolean; message?: string }>({});
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const service = useMemo(() => services.find((item) => item.id === selectedService), [selectedService]);

  const handleSubmit = (formData: FormData) => {
    if (!service) return;
    formData.set("serviceId", service.supabaseId ?? service.id);
    formData.set("serviceName", service.name);
    formData.set("durationMinutes", String(service.durationMinutes));
    formData.set("startAt", selectedSlot);
    startTransition(async () => {
      const result = await bookAppointmentAction(null, formData);
      setFormState(result);
      if (result.ok) {
        toast({
          title: "Termin bestätigt",
          description: "Buchung gespeichert und im Portal sichtbar.",
        });
      } else {
        toast({ title: "Fehler", description: result.message ?? "Bitte erneut versuchen" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Phase 4 · Booking Engine</p>
        <h1 className="text-3xl font-semibold leading-tight text-ink">Service wählen, Konto anlegen, Termin sichern</h1>
        <p className="max-w-3xl text-sm text-muted">
          Vollständiger Fluss: Auswahl aus dem Service-Katalog, Account & Login-Felder, Slot-Buchung mit serverseitigem
          Action-Handler und Bestätigungsmail (Console). Ergebnisse landen im Kunden-Portal.
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          <Badge>Account</Badge>
          <Badge variant="outline">RLS-ready</Badge>
          <Badge variant="muted">Supabase optional</Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Service & Konto</CardTitle>
            <CardDescription className="text-sm text-muted">
              Wähle eine Leistung, erfasse deine Kontaktdaten und sichere dir direkt einen Slot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-4 text-sm text-muted">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="firstName">
                    Vorname
                  </label>
                  <Input id="firstName" name="firstName" required placeholder="Alex" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="lastName">
                    Nachname
                  </label>
                  <Input id="lastName" name="lastName" required placeholder="Muster" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="email">
                    E-Mail
                  </label>
                  <Input id="email" name="email" type="email" required placeholder="kunde@example.ch" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="phone">
                    Telefon
                  </label>
                  <Input id="phone" name="phone" placeholder="+41 78 000 00 00" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="password">
                    Passwort (für Konto)
                  </label>
                  <Input id="password" name="password" type="password" required minLength={8} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="service">
                    Leistung
                  </label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service" className="bg-surface">
                      <SelectValue placeholder="Service wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} · {item.durationMinutes} Min
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {service ? (
                <div className="rounded-xl border border-border/70 bg-card p-4 text-sm text-muted">
                  <div className="flex flex-wrap items-center gap-3 text-ink">
                    <Badge variant="outline">{service.category}</Badge>
                    <span>{service.durationMinutes} Min</span>
                    <span className="font-semibold">{service.price}</span>
                  </div>
                  <p className="pt-2">{service.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink">Slot wählen</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {slotOptions.map((slot) => {
                    const end = service ? addMinutes(new Date(slot), service.durationMinutes) : addMinutes(new Date(slot), 60);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                          selectedSlot === slot ? "border-accent bg-surface" : "border-border/70 bg-card hover:border-accent"
                        }`}
                      >
                        <span className="block font-semibold text-ink">
                          {new Date(slot).toLocaleString("de-CH", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-xs text-muted">
                          bis {end.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="note">
                  Hinweis (optional)
                </label>
                <Input id="note" name="note" placeholder="z.B. ruhiger Platz, Allergien, bevorzugte Sprache" />
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <Badge variant="success">Account + Termin</Badge>
                <span>Supabase wird verwendet, sobald URL & Key gesetzt sind. Andernfalls Demo-Speicher.</span>
              </div>

              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? "Bucht..." : "Termin buchen"}
              </Button>
              {formState?.message ? <p className="text-xs text-ink">{formState.message}</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card className="border-dashed border-border/70">
          <CardHeader>
            <CardTitle>Live-Ziele Phase 4</CardTitle>
            <CardDescription className="text-sm text-muted">
              Vollständiger Pfad von der öffentlichen Seite ins Kundenkonto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-accent-strong">Portal</p>
              <p>Gebuchte Slots erscheinen im Kundenportal und können storniert werden.</p>
              <Button asChild variant="secondary">
                <Link href="/portal">Portal öffnen</Link>
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-accent-strong">Account</p>
              <p>Registrierung & Login nutzen server actions. Ohne Supabase setzen wir ein Demo-Cookie.</p>
              <Button asChild variant="ghost">
                <Link href="/auth">Account verwalten</Link>
              </Button>
            </div>
            <div className="space-y-2 rounded-lg border border-border/70 bg-surface p-3 text-xs">
              <p className="font-semibold text-ink">Hinweise</p>
              <ul className="space-y-1">
                <li>Server Action validiert Daten mit Zod.</li>
                <li>Bei echter Supabase wird Nutzer, Kunde & Termin persistiert.</li>
                <li>Bestätigungsmail geht als Console-Log raus.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
