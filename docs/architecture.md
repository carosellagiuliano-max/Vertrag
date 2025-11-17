# Architektur – Schnittwerk Salon OS (Phase 5)

## Zielsetzung
- Phase 5 erweitert Booking + Portal um Shop, Warenkorb und Checkout mit Stripe-Testkasse oder Demo-Speicher.
- Supabase wird verwendet, sofern ENV gesetzt sind, sonst läuft ein Demo-Store (In-Memory) mit denselben Flows.
- Designsystem aus Phase 2 und Public-Site aus Phase 3 bleiben Grundlage für alle neuen Screens.

## Tech-Stack
- **Next.js 16** (App Router, Server Components bevorzugt, React Compiler optional/off).
- **TypeScript** mit Strict Mode und Pfadalias `@/*`.
- **Tailwind CSS 4** mit `@theme` Tokens, `tailwind.config.ts` für Komponenten-Scans.
- **shadcn/ui bereit** via `components.json`, `lib/utils.ts` (`cn`) und Aliasen für künftige Primitives.
- **Supabase optional** via Service-Role Client in `lib/supabase/admin.ts`.

## Layout & Design Tokens
- Fonts: Geist Sans/Mono per `app/layout.tsx` und CSS-Variablen.
- Farb- und Radius-Tokens in `app/globals.css` und `tailwind.config.ts` (surface/card/ink/accent/border/ring) plus Animations-Keyframes
  für Dialog/Sheet/Toast/Skeleton.
- Grundlayout: `SiteShell` mit Header/Footer, max. Breite `max-w-content`, Sticky Header mit Phase-Status.
- `Toaster` global im Layout, damit Radix Toasts überall funktionieren.

## Projektstruktur
- `app/` – Routing, Layout und Seiten (App Router). Einstieg `app/page.tsx` zeigt Phase-5-Status, Booking/Portal/Shop-Links.
- `components/` – Layout- und UI-Bausteine (`components/layout/site-shell.tsx`, `components/ui/*` für Primitives).
- `features/` – Domain-Module wie `features/booking` mit Supabase/Demo-Store-Logik.
- `lib/` – Querschnittliche Helfer (`lib/utils.ts`, `config/env.ts`, Supabase, Notifications).
- `styles/` – zukünftige thematische Stylesheets oder Token-Definitionen.
- `supabase/` – Migrationen (`migrations/20250109000000_phase1_core.sql`) und Seed-Daten (`seed/seed.sql`).
- `docs/` – lebende Dokumentation (Architektur, Dev Setup, Datenmodell, Security/RLS, Design System).

## Daten- & Sicherheitsgedanken (Phase 1+5)
- Supabase mit RLS: Standard deny, Policies per `auth.uid()`/`auth.role()`; Salons, Profile, Staff, Customers, Services, Appointments abgedeckt.
- Profile gekoppelt an Auth Users, Service Role nur in Edge Functions/Jobs.
- Buchung: Server Action `bookAppointmentAction` validiert mit Zod und persistiert über Service Role (falls ENV), sonst Demo-Store.
- Shop: Checkout speichert Orders und Order-Items, reduziert Lager (`product_stock`) und leitet optional zur Stripe-Testkasse weiter.
- Kundenportal liest Termine und Bestellungen über Supabase (Service Role) oder Fallback-Store; Storno-Action setzt Status `cancelled`.
- Logging ohne PII, Audit-Logs für kritische Ereignisse (Termine, Bestellungen, Rollenänderungen) folgen.

## Delivery-Phasen (Auszug)
1. **Phase 0**: Scaffolding, Layout, Tokens, Docs, shadcn-Setup.
2. **Phase 1**: Datenbank & Auth (Salons, Profiles, Services, Appointments) inkl. RLS-Doku und Seeds.
3. **Phase 2**: Design System (Buttons, Card, Input, Select, Badge, Dialog, Sheet, Toast, Skeleton).
4. **Phase 3**: Öffentliche Seiten mit Booking-Einstieg, SEO-Basics.
5. **Phase 4**: Buchung mit Account, Portal, Validierung, optionale Supabase-Persistenz.
6. **Phase 5**: Shop mit Produkten, Lagerstand, Warenkorb, Checkout (Stripe optional) und Portal-Orders.

## Qualitätsleitplanken
- Guard Rails aus `codex.md`: Einfachheit, explizite Struktur, Validierung an IO-Grenzen, starke Typisierung.
- Jede Migration mit Up/Down, dokumentiert in `docs/security-and-rls.md` (kommt mit Phase 1).
- CI-Erwartung: Lint, Typecheck, Tests auf jedem Schritt.
