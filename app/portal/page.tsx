import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelBooking, loadUpcomingAppointments } from "@/features/booking/booking-service";
import { loadOrders } from "@/features/shop/shop-service";
import { getSessionEmail, logoutAction } from "../auth/actions";

async function UpcomingList({ email }: { email?: string }) {
  const appointments = await loadUpcomingAppointments(email);

  if (!email) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <CardTitle className="text-lg">Bitte einloggen</CardTitle>
          <CardDescription className="text-sm text-muted">
            Melde dich an, um deine Termine zu sehen. Demo-Mode setzt das Cookie auch ohne Supabase.
          </CardDescription>
          <Button asChild>
            <Link href="/auth">Zum Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!appointments.length) {
    return (
      <Card>
        <CardContent className="space-y-3 py-6">
          <CardTitle className="text-lg">Noch keine Termine</CardTitle>
          <CardDescription className="text-sm text-muted">
            Buche einen Termin, um ihn hier zu sehen. Demo-Bookings bleiben bis zum Neustart bestehen.
          </CardDescription>
          <Button asChild>
            <Link href="/booking">Termin buchen</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {appointments.map((appt) => (
        <form
          key={appt.id}
          action={async () => {
            "use server";
            await cancelBooking(appt.id, "Kunde storniert im Portal");
          }}
        >
          <Card className="border-border/70">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Termin</p>
                <CardTitle className="text-lg">{appt.serviceName}</CardTitle>
                <CardDescription className="text-sm text-muted">
                  {format(new Date(appt.startAt), "EEEE, dd.MM.yyyy HH:mm", { locale: de })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={appt.status === "scheduled" ? "success" : "outline"}>{appt.status}</Badge>
                <Button type="submit" variant="secondary" size="sm">
                  Stornieren
                </Button>
              </div>
            </CardHeader>
          </Card>
        </form>
      ))}
    </div>
  );
}

export default async function PortalPage() {
  const email = getSessionEmail();
  const orders = await loadOrders(email);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-strong">Portal</p>
          <h1 className="text-3xl font-semibold leading-tight text-ink">Meine Termine</h1>
          <p className="text-sm text-muted">Phase 5: Termine, Bestellungen und Stripe-Demo an einem Ort.</p>
        </div>
        {email ? (
          <form action={logoutAction}>
            <Button type="submit" variant="secondary">
              Logout {email}
            </Button>
          </form>
        ) : null}
      </div>

      <UpcomingList email={email} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Bestellungen</h2>
          <Badge variant="outline">Shop</Badge>
        </div>
        <div className="grid gap-3">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 py-6">
                <CardTitle className="text-lg">Noch keine Bestellungen</CardTitle>
                <CardDescription className="text-sm text-muted">Kaufe im Shop, um hier eine Übersicht zu sehen.</CardDescription>
                <Button asChild>
                  <Link href="/shop">Zum Shop</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} className="border-border/70">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-strong">Bestellung</p>
                    <CardTitle className="text-lg">{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription className="text-sm text-muted">
                      {new Date(order.createdAt).toLocaleDateString("de-CH")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={order.status === "paid" ? "success" : "outline"}>{order.status}</Badge>
                    <Badge variant="muted">{order.currency ?? "CHF"}</Badge>
                    <span className="text-sm font-semibold text-ink">CHF {order.totalChf.toFixed(2)}</span>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
