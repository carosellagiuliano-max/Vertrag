# Developer Setup

## Voraussetzungen
- Node.js 20+ (Next.js 16 unterstützt 18.18+, empfohlen 20 LTS).
- npm (Standard), keine globalen Framework-Installationen nötig.
- Optional: Supabase CLI für Migrationen (Phase 1+) und Service-Role-Keys für Booking/Shop. Stripe-Test-Keys für Checkout.

## Lokale Installation
```bash
npm install
```

## Development Server
```bash
npm run dev
```
- Läuft per Default auf `http://localhost:3000`.
- Läuft per Default auf `http://localhost:3000`.
- Public Pages in Phase 5: `/services`, `/contact`, `/booking`, `/shop`, `/checkout`, plus `/auth` und `/portal` für Konto, Termine & Bestellungen.
- App Router + Server Components; bei neuen Routen `app/` nutzen.

## Supabase lokal (Phase 1+)
- Supabase CLI + Docker notwendig.
- Starten und Datenbank initialisieren:
  ```bash
  supabase start
  supabase migration up
  supabase db seed
  ```
- Seed-Login: `admin@schnittwerk.test` / `ChangeMe123!`.
- Für Buchungen & Orders: `.env.local` mit `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` befüllen.

## Linting & Qualität
```bash
npm run lint
npm run typecheck
npm test
# optional mit Supabase: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:db
```
- Lint nutzt `next lint` mit `eslint.config.mjs`.
- TypeScript strikt mit `tsc --noEmit`.
- Vitest deckt Domäne (Booking/Voucher/Loyalty/Notifications) ab; `test:db` prüft RLS, falls Supabase-Keys gesetzt sind.

## shadcn/ui & Radix Nutzung
- Konfiguration liegt in `components.json` mit Aliassen (`@/components`, `@/lib/utils`, `@/components/ui`).
- Radix ist bereits installiert (`@radix-ui/react-dialog`, `select`, `toast`, `slot`).
- Tokens/Styles greifen auf `tailwind.config.ts` (Keyframes) und `app/globals.css` zurück.
- Beispiel: `components/ui/*` enthält Phase-2-Primitives (Button, Card, Input, Select, Dialog, Sheet, Toast, Skeleton).

## Struktur-Richtlinien
- Neue Domain-Module unter `features/<bereich>` anlegen.
- Geteilte Logik unter `lib/`, UI in `components/` (ggf. `components/ui` für shadcn-Primitives).
- Supabase Artefakte in `supabase/migrations` und `supabase/seed` ablegen.

## Environment Variablen
- `USE_DEMO='true'` (default: `false`): Aktiviert Demo-Mode in Services (admin, booking, shop). In Prod immer `false`.
- `.env.local` ist per `.gitignore` ausgeschlossen.
- Für Phase 5/6/7: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (nur serverseitig), optional `NEXT_PUBLIC_SALON_ID`,
  `NEXT_PUBLIC_STAFF_ID`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `ADMIN_EMAIL` (Gate für Admin-Portal).
- Ohne diese Variablen läuft der Demo-In-Memory-Store weiter (Termine/Bestellungen bis Prozessende).

## Troubleshooting
- CSS/Tokens: Tailwind 4 nutzt `@import "tailwindcss";` + `@theme` in `app/globals.css`.
- Pfadalias `@/*` funktioniert für App-, Component-, Feature- und Lib-Dateien (siehe `tsconfig.json`).
