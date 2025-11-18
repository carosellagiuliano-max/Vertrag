// @ts-nocheck
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdminEmail, loadAdminDashboard } from "@/features/admin/admin-service";
import { getSessionEmail } from "../auth/actions";

function KeyValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value ?? "–"}</span>
    </div>
  );
}

export default async function AdminPage() {
  const sessionEmail = getSessionEmail();
  const allowed = isAdminEmail(sessionEmail);
  const dashboard = await loadAdminDashboard();

  if (!allowed) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Phase 7</p>
          <h1 className="text-3xl font-semibold leading-tight">Admin-Portal</h1>
          <p className="text-sm text-muted">
            RBAC: Zugriff nur für Admin-E-Mail. Nutze das Seed-Login oder setze ADMIN_EMAIL in der Umgebung.
          </p>
        </div>
        <Card>
          <CardContent className="space-y-3 py-6">
            <CardTitle>Kein Zugriff</CardTitle>
            <CardDescription className="text-sm text-muted">
              Bitte als Admin einloggen (Seed: admin@schnittwerk.test / ChangeMe123!). Demo-Modus akzeptiert das Cookie ohne Supabase.
            </CardDescription>
            <Button asChild>
              <Link href="/auth">Zum Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Phase 7</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink">Admin-Portal</h1>
          <p className="text-sm text-muted">
            Hardening: Analytics für Buchungen/Umsatz, leere Zustände, Tests für Booking/Voucher/Loyalty/Notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">RBAC</Badge>
          <Badge variant="success">{sessionEmail}</Badge>
        </div>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Analytics</CardTitle>
            <Badge variant="muted">{dashboard.analytics.period}</Badge>
          </div>
          <CardDescription>Buchungen, Umsatz, Auslastung und Kundenbindung der letzten 30 Tage.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <KeyValue label="Buchungen" value={dashboard.analytics.bookings} />
            <KeyValue
              label="Umsatz"
              value={`CHF ${dashboard.analytics.revenueChf.toFixed(2)}`}
            />
            <KeyValue
              label="Auslastung"
              value={`${Math.round(dashboard.analytics.occupancyRate * 100)}%`}
            />
            <KeyValue
              label="Retention"
              value={`${Math.round(dashboard.analytics.retentionRate * 100)}%`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Services & Team</CardTitle>
              <Badge variant="muted">Management</Badge>
            </div>
            <CardDescription>Aktive Leistungen und Rollen der Mitarbeitenden.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">Services</h3>
              {dashboard.services.length === 0 ? (
                <p className="text-xs text-muted">Keine Services gefunden. Bitte Stammdaten prüfen.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {dashboard.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-ink">{service.name}</p>
                        <p className="text-xs text-muted">
                          {service.durationMinutes ?? "?"} Min · CHF {service.priceChf.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{service.category ?? "Kategorie"}</Badge>
                        <Badge variant={service.active ? "success" : "outline"}>{service.active ? "aktiv" : "inaktiv"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink">Mitarbeitende</h3>
              {dashboard.staff.length === 0 ? (
                <p className="text-xs text-muted">Kein Team hinterlegt. Bitte Roster laden.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {dashboard.staff.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-ink">{person.name}</p>
                        <p className="text-xs text-muted">{person.title ?? "Team"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{person.role}</Badge>
                        <Badge variant={person.active ? "success" : "outline"}>{person.active ? "aktiv" : "inaktiv"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Kalender</CardTitle>
              <Badge variant="muted">Filter & Status</Badge>
            </div>
            <CardDescription>Nächste Termine mit Staff/Service-Kontext.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.appointments.length === 0 ? (
              <p className="text-sm text-muted">Keine Termine gefunden.</p>
            ) : (
              dashboard.appointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-ink">{appt.serviceName ?? "Termin"}</p>
                    <p className="text-xs text-muted">
                      {format(new Date(appt.startAt), "EEE, dd.MM.yyyy HH:mm", { locale: de })} · {appt.staffName ?? "Team"}
                    </p>
                    <p className="text-xs text-muted">{appt.customerName ?? "Kunde"}</p>
                  </div>
                  <Badge variant={appt.status === "scheduled" ? "success" : "outline"}>{appt.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Kunden & Export</CardTitle>
              <Badge variant="muted">DSG/Marketing</Badge>
            </div>
            <CardDescription>12 zuletzt angelegte Kunden inkl. Opt-In-Status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboard.customers.length === 0 ? (
              <p className="text-xs text-muted">Keine Kunden gefunden. Export bleibt gesperrt.</p>
            ) : (
              dashboard.customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-ink">{customer.name || "Unbekannt"}</p>
                    <p className="text-xs text-muted">{customer.email ?? "keine E-Mail"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={customer.marketingOptIn ? "success" : "outline"}>
                      {customer.marketingOptIn ? "Opt-In" : "Opt-Out"}
                    </Badge>
                    <Badge variant="secondary">
                      {customer.createdAt ? format(new Date(customer.createdAt), "dd.MM.") : "–"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted">CSV-Export folgt mit Backend-API (Phase 7+).</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Produkte & Lager</CardTitle>
              <Badge variant="muted">Shop</Badge>
            </div>
            <CardDescription>Aktive Produkte mit Bestand.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {dashboard.products.length === 0 ? (
                <p className="text-xs text-muted">Keine Produkte aktiv. Lagerbestand nicht berechenbar.</p>
              ) : (
                dashboard.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-muted">CHF {product.priceChf.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Stock {product.stock ?? 0}</Badge>
                      <Badge variant={product.active ? "success" : "outline"}>{product.active ? "aktiv" : "inaktiv"}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Settings</CardTitle>
              <Badge variant="muted">Policies</Badge>
            </div>
            <CardDescription>Öffnungszeiten, MwSt. und Storno-Regeln.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <KeyValue label="Öffnungszeiten" value={dashboard.settings.openingHours} />
            <KeyValue label="MwSt" value={dashboard.settings.vatRate} />
            <KeyValue label="Storno bis" value={`${dashboard.settings.cancellationWindowHours ?? 24}h vorher`} />
            <p className="text-xs text-muted">Anpassung folgt per Settings-API, RLS bleibt serverseitig erzwungen.</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Notification-Templates</CardTitle>
              <Badge variant="muted">E-Mail</Badge>
            </div>
            <CardDescription>Betreffzeilen und Zustellstatus.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboard.notifications.map((template) => (
              <div key={template.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2">
                <div>
                  <p className="font-medium text-ink">{template.key}</p>
                  <p className="text-xs text-muted">{template.subject}</p>
                </div>
                <Badge variant="secondary">{template.status}</Badge>
              </div>
            ))}
            <p className="text-xs text-muted">Test-Send und Variablen-Preview folgen in Phase 7+.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
