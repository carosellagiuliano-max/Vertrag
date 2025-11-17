"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction, registerAction } from "./actions";

export default function AuthPage() {
  const [registerState, registerSubmit] = useFormState(registerAction, { ok: false });
  const [loginState, loginSubmit] = useFormState(loginAction, { ok: false });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            <Badge>Phase 4</Badge>
            <Badge variant="outline">Account</Badge>
          </div>
          <CardTitle>Registrieren</CardTitle>
          <CardDescription>Profil anlegen und später in Portal & Buchung nutzen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={registerSubmit} className="space-y-3 text-sm text-muted">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="email">
                E-Mail
              </label>
              <Input id="email" name="email" type="email" required placeholder="kunde@example.ch" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="password">
                Passwort
              </label>
              <Input id="password" name="password" type="password" required minLength={8} placeholder="Mind. 8 Zeichen" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="firstName">
                  Vorname
                </label>
                <Input id="firstName" name="firstName" placeholder="Alex" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="lastName">
                  Nachname
                </label>
                <Input id="lastName" name="lastName" placeholder="Muster" />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Account erstellen
            </Button>
            {registerState?.message ? <p className="text-xs text-ink">{registerState.message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
            <Badge>Phase 4</Badge>
            <Badge variant="outline">Login</Badge>
          </div>
          <CardTitle>Einloggen</CardTitle>
          <CardDescription>Bestehendes Konto aktivieren und Portal öffnen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginSubmit} className="space-y-3 text-sm text-muted">
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="login-email">
                E-Mail
              </label>
              <Input id="login-email" name="email" type="email" required placeholder="kunde@example.ch" />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink" htmlFor="login-password">
                Passwort
              </label>
              <Input id="login-password" name="password" type="password" required minLength={8} placeholder="Mind. 8 Zeichen" />
            </div>
            <Button type="submit" className="w-full" variant="secondary">
              Einloggen
            </Button>
            {loginState?.message ? <p className="text-xs text-ink">{loginState.message}</p> : null}
            <p className="text-xs text-muted">
              Demo: Bei fehlender Supabase-Konfiguration wird ein Session-Cookie gesetzt, damit Portal & Buchung reagieren.
              <Link className="ml-1 underline decoration-dotted underline-offset-4" href="/portal">
                Zum Portal
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
