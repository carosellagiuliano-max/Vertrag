"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const services = [
  { value: "cut", label: "Haarschnitt" },
  { value: "color", label: "Coloration" },
  { value: "spa", label: "Hair Spa" },
];

export function DesignSystemShowcase() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("cut");

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge>Neu in Phase 2</Badge>
            <Badge variant="muted">UI-Baukasten</Badge>
          </div>
          <CardTitle>Interaktive Primitives</CardTitle>
          <CardDescription>
            Buttons, Dialoge, Sheets, Toasts und Formularfelder basieren auf Radix UI und den Schnittwerk Tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destruktiv</Button>
            <Button variant="link">Link</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="service">
                Service
              </label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger id="service">
                  <SelectValue placeholder="Wähle eine Leistung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectLabel>Salondienstleistungen</SelectLabel>
                  {services.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted">
                Auswahl wird im Browser-State gehalten und kann für Preis-/Dauer-Logik genutzt werden.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="note">
                Kundenwunsch
              </label>
              <Input id="note" placeholder="Sanfter Bob, ohne Stufen" />
              <p className="text-xs text-muted">Formfelder folgen Tokens für Radius, Kontrast und Fokus-Ring.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog öffnen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Salon-Hinweis</DialogTitle>
                  <DialogDescription>
                    Dialoge nutzen `@radix-ui/react-dialog` mit Tokens für Overlay, Schatten und Fokus.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm text-muted">
                  <p>Ideal für Bestätigungen, Previews oder kurze Formulare.</p>
                  <p>Schließt mit Escape, Overlay-Klick oder Close-Button.</p>
                </div>
                <DialogFooter>
                  <Button variant="ghost">Abbrechen</Button>
                  <Button>Verstanden</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Sheet rechts</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Mobilfreundliche Panels</SheetTitle>
                  <SheetDescription>Für Navigation, Detailkarten oder schnellen Checkout geeignet.</SheetDescription>
                </SheetHeader>
                <div className="space-y-3 text-sm text-muted">
                  <p>Beinhaltet Overlay, Slide-In-Animation und Close-Icon.</p>
                  <p>Maximalbreite 560px auf größeren Screens.</p>
                </div>
                <SheetFooter>
                  <Button variant="ghost">Später</Button>
                  <Button>Weiter</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              onClick={() =>
                toast({
                  title: "Toast ausgelöst",
                  description: "Toasts nutzen Radix, Swipe-gesten und behalten fünf Einträge.",
                })
              }
            >
              Toast zeigen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle>Skeletons & States</CardTitle>
          <CardDescription>Nutze Skeletons für Ladezustände und Badge-Varianten für Status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Skeleton-Beispiel</p>
            <div className="grid gap-3">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">Status-Badges</p>
            <div className="flex flex-wrap gap-2">
              <Badge>aktiv</Badge>
              <Badge variant="muted">Entwurf</Badge>
              <Badge variant="outline">RLS geprüft</Badge>
              <Badge variant="success">Live</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
