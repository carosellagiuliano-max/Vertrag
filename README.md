# Schnittwerk Salon OS

Salon-Betriebssystem von Schnittwerk (St. Gallen, CH). Phase 5 erweitert Booking + Portal um Shop, Warenkorb und Checkout
(Stripe-Testmodus oder Demo-Speicher) auf Basis des Phase-2-Designsystems.

## Quickstart
```bash
npm install
npm run dev
```

### Supabase lokal (Phase 1+)
```bash
supabase start
supabase migration up
supabase db seed
```
- Standard-Seed-User: `admin@schnittwerk.test` / `ChangeMe123!`.
- Erfordert die [Supabase CLI](https://supabase.com/docs/guides/cli) und Docker im Hintergrund.
- Für echte Buchungen und Orders ENV setzen (siehe unten). Ohne Keys laufen Booking/Portal/Shop im Demo-Speicher.

## Projektstruktur
- `app/` – App Router Layouts & Seiten, inkl. Public-Routen `/services`, `/contact`, `/booking`, `/shop`, `/checkout` sowie `/portal` und `/auth`.
- `components/` – Wiederverwendbare Layout-/UI-Bausteine (z. B. `layout/site-shell`, `components/ui/*`).
- `features/` – Platzhalter für Domain-Module (booking, shop, admin, notifications, loyalty …).
- `lib/` – Helfer (`utils.ts` mit `cn`, `config/env.ts`, Supabase- und Notification-Utilities).
- `styles/` – zukünftige Style-/Token-Dateien.
- `supabase/` – Ordner für Migrationen/Seeds (Phase 1+).
- `docs/` – Architektur- und Setup-Dokumentation.

## Technik
- Next.js 16 (App Router, TS strict)
- Tailwind CSS 4 mit `@theme` Tokens und `tailwind.config.ts`
- shadcn-Konfiguration (`components.json`), Aliasse `@/*`
- Supabase optional angebunden über Service-Role Client (`@supabase/supabase-js`)

## Weiterführende Docs
- [Architektur](docs/architecture.md)
- [Developer Setup](docs/dev-setup.md)
- [Datenmodell](docs/data-model.md)
- [Security & RLS](docs/security-and-rls.md)
- [Design System](docs/design-system.md)

Guard Rails und Roadmap siehe `codex.md` im Repository.

## Environment (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SALON_ID=11111111-1111-1111-1111-111111111111
NEXT_PUBLIC_STAFF_ID=22222222-2222-2222-2222-222222222222
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
- Ohne Supabase-Variablen laufen Buchungs-Action, Portal und Shop im Demo-Speicher (Sessions per Cookie).
- Stripe-Keys sind optional; bei fehlenden Keys wird der Demo-Checkout genutzt.
- Für Produktion: Service Role Key nur serverseitig nutzen, nicht im Client exposen.
