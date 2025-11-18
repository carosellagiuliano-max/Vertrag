# Architektur – Schnittwerk Salon OS (Post-Phase 7c)

## Zielsetzung (Post-Phase 7c)
- Admin-Portal gehärtet: Analytics-Kacheln (Buchungen/Umsatz/Retention), Leerzustände, Test-Suite für Domain (Booking/Voucher/Loyalty/Notifications).
- Phase 6/7c: Notifications/Loyalty/Vouchers + unified audit_logs/triggers auf allen core tables (appointments/orders/customers/services/products + Phase6).
- Supabase wird verwendet, sofern ENV gesetzt sind, sonst läuft ein Demo-Store (In-Memory) mit denselben Flows; Admin liest dann Demo-Daten.
- Designsystem aus Phase 2 und Public-Site aus Phase 3 bleiben Grundlage für alle neuen Screens.

## Tech-Stack
- **Next.js 16** (App Router, Server Components bevorzugt, React Compiler optional/off).
- **TypeScript** mit Strict Mode und Pfadalias `@/*`.
- **Tailwind CSS 4** mit `@theme` Tokens, `tailwind.config.ts` für Komponenten-Scans.
- **shadcn/ui bereit** via `components.json`, `lib/utils.ts` (`cn`) und Aliasen für künftige Primitives.
- **Supabase** (optional): Service-Role Client in `lib/supabase/admin.ts`; fallback zu in-memory Demo-Store.

## Layout & Design Tokens
- Fonts: Geist Sans/Mono per `app/layout.tsx` und CSS-Variablen.
- Farb- und Radius-Tokens in `app/globals.css` und `tailwind.config.ts` (surface/card/ink/accent/border/ring) plus Animations-Keyframes
  für Dialog/Sheet/Toast/Skeleton.
- Grundlayout: `SiteShell` mit Header/Footer, max. Breite `max-w-content`, Sticky Header mit Phase-Status (Phase 7, Admin-Link im Header).
- `Toaster` global im Layout, damit Radix Toasts überall funktionieren.

- `app/` – Routing/Layout/Seiten (App Router, Server Components). `app/page.tsx`: Phase-Status (post-7c), Links (Booking/Portal/Shop/Admin).
- `components/` – UI/Design System (`shadcn/ui` Primitives: button/card/dialog/input/select/sheet/toast/badge/skeleton; `site-shell.tsx` Layout).
- `features/` – Domain-Module wie `features/booking` mit Supabase/Demo-Store-Logik.
- `lib/` – Querschnittliche Helfer (`lib/utils.ts`, `config/env.ts`, Supabase, Notifications).
- `styles/` – zukünftige thematische Stylesheets oder Token-Definitionen.
- `supabase/` – Migrationen (`migrations/20250109000000_phase1_core.sql`) und Seed-Daten (`seed/seed.sql`).
- `docs/` – lebende Dokumentation (Architektur, Dev Setup, Datenmodell, Security/RLS, Design System).

## Domain/Services Separation & Multi-Tenancy
- **lib/domain/**: Pure business rules (booking-rules.ts, loyalty.ts, notifications.ts, vouchers.ts) – unidirektional, stateless, testable.
- **features/**-service.ts: Orchestration (Supabase/DB + Domain Calls + Notifications/Email).
- **Multi-Tenant Ready**: `salon_id` scoping in allen Tabellen/Policies/Queries; RLS via staff.salon_id/auth.uid().

## Daten- & Sicherheitsgedanken (Post-Phase 7c)
- RLS: Deny-by-default, granular Policies (`salon_users_read`, `customers_read_own`, `service_role_full`) für alle Tabellen inkl. Phase6 (audit_logs, notification_templates, vouchers, loyalty_*).
- Audit Enforcement: Unified `audit_logs` + generic `handle_audit()` triggers auf **allen** core/Phase6 tables (INSERT/UPDATE/DELETE → jsonb old/new data).
- Profile gekoppelt an Auth Users, Service Role nur in Edge Functions/Jobs.
- Buchung: Server Action `bookAppointmentAction` validiert mit Zod und persistiert über Service Role (falls ENV), sonst Demo-Store.
- Shop: Checkout speichert Orders und Order-Items, reduziert Lager (`product_stock`) und leitet optional zur Stripe-Testkasse weiter.
- Admin: RBAC-Gate via `ADMIN_EMAIL` und Session-Cookie, liest Services/Staff/Appointments/Customers/Products via Service-Role-Client oder Demo-Fallback.
- Kundenportal liest Termine und Bestellungen über Supabase (Service Role) oder Fallback-Store; Storno-Action setzt Status `cancelled`.
- Notifications: lib/notifications/email.ts + salon-scoped templates.

## Delivery-Phasen (Auszug)
1. **Phase 0**: Scaffolding, Layout, Tokens, Docs, shadcn-Setup.
2. **Phase 1**: Datenbank & Auth (Salons, Profiles, Services, Appointments) inkl. RLS-Doku und Seeds.
3. **Phase 2**: Design System (Buttons, Card, Input, Select, Badge, Dialog, Sheet, Toast, Skeleton).
4. **Phase 3**: Öffentliche Seiten mit Booking-Einstieg, SEO-Basics.
5. **Phase 4**: Buchung mit Account, Portal, Validierung, optionale Supabase-Persistenz.
6. **Phase 5**: Shop mit Produkten, Lagerstand, Warenkorb, Checkout (Stripe optional) und Portal-Orders.
7. **Phase 7c**: Audit-Triggers auf core tables (appointments/orders/customers/services/products); Tests (domain/integration/e2e).

## Qualitätsleitplanken
- Guard Rails aus `codex.md`: Einfachheit, explizite Struktur, Validierung an IO-Grenzen, starke Typisierung.
- Jede Migration mit Up/Down, dokumentiert in `docs/security-and-rls.md` (kommt mit Phase 1).
- CI-Erwartung: Lint, Typecheck, Tests auf jedem Schritt.
