# Testing Leitfaden

Dieser Leitfaden bündelt die Teststrategie für Schnittwerk nach codex.md.

## Ziele
- Business-Regeln und RLS-Policies verlässlich absichern.
- Sicherheits- und Datenschutz-Pflichten (DSG/DSGVO) prüfbar machen.
- Entwickler*innen klare Commands an die Hand geben, die lokal wie in CI laufen.

## Testpyramide
- **Unit** (`tests/domain.test.ts`): Domänenlogik (booking-rules.ts, loyalty.ts, notifications.ts, vouchers.ts). Happy/Edge-Cases für Regeln, Berechnungen.
- **Integration** (`tests/integration/`):
  - `audit.test.ts`: Audit-Triggers (INSERT/UPDATE/DELETE auf appointments, orders, customers, services, products, Phase6-Tabellen).
  - `rls.test.ts`: RLS-Policies Smoke (service_role vs. anon auf protected tables).
- **E2E Flows** (`tests/e2e/` mit `USE_DEMO=true` Vitest):
  - `booking.test.ts`, `checkout.test.ts`, `portal.test.ts`, `admin-crud.test.ts`.
  - Kernpfade: Booking → Portal/Storno → Checkout → Admin CRUD (Services/Staff/Appointments/Orders/Products).

## Commands
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Unit-Tests**: `npm test` (vitest run tests/domain.test.ts)
- **Integration (DB/RLS/Audit)**: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:db` (vitest run tests/integration --runInBand)
- **All Tests**: `npm test` (vitest run; inkl. domain + integration wenn DB ENV)
- **E2E Flows (stubs/demo)**: `USE_DEMO=true npx vitest run tests/e2e` (booking/checkout/portal/admin-crud)
- **Build Smoke**: `npm run build`

Die CI-Pipeline führt Lint, Typecheck, Unit-Tests und Build standardmäßig aus. Integrationstests können per Workflow-Dispatch aktiviert werden, weil sie eine laufende Test-Datenbank benötigen.

## Einrichtung für Integrationstests
- Starte Supabase lokal (`supabase start`) oder nutze eine dedizierte Test-Instanz.
- Spiele die Seeds ein: `supabase db reset --db-url $SUPABASE_DB_URL --password $POSTGRES_PASSWORD` (uses supabase/seed/seed.sql)
- Lege Testrollen an (`anon`, `authenticated`, `service_role`) gemäß Supabase-Standard; Policies werden dadurch erzwungen.

## Abdeckungserwartung
- **RLS/Audit**: Smoke-Tests für service_role/anon; Audit-Trigger-Assertions (expect audit_logs entries post DML).
- **Domain-Regeln**: Happy- und Edge-Cases (z.B. Storno-Fenster, No-Show, Gutschein-Limits, Loyalitätslevel).
- **Flows**: E2E mit Demo-Store (USE_DEMO=true): Booking, Checkout, Portal-List/Storno, Admin-CRUD.

## Reporting
## Coverage Gaps & Enhancements (planned)
- **Unit**: Vollständige Abdeckung für alle domain/*.ts (z.B. notification/email.ts).
- **Integration**: Erweiterte RLS (customer/staff Rollen), Audit für alle Trigger-Tabellen.
- **E2E**: Playwright für browser-basierte Flows (optional); Coverage für Loyalty/Voucher in Checkout.
- **Strategy**: Pyramide erweitern → 70% Unit, 20% Integration (critical DB paths), 10% E2E Smoke (critical user flows).

## Reporting
- Vitest JUnit-XML: `./coverage/unit.xml`, `./coverage/integration.xml` (via --reporter=junit).
- Integrationstests schreiben nach `./reports/integration.xml`.
- Coverage kann bei Bedarf mit `vitest run --coverage` aktiviert werden; aktuell optional, weil der Fokus auf RLS-Korrektheit liegt.

## Troubleshooting
- **Type-Fehler**: `npm run typecheck -- --traceResolution`.
- **No DB for test:db**: Setze SUPABASE_URL/SERVICE_ROLE_KEY oder skip.
- **RLS schlägt fehl**: Prüfe, ob die JWT-Rolle korrekt gesetzt ist (`supabase.auth.admin.generateLink()` oder `supabase.auth.signInWithPassword`).
- **Flaky E2E**: Zeitliche Puffer (`await page.waitForSelector`) erhöhen und lokale Netzwerk-Proxy-Variablen entfernen.
- **USE_DEMO**: In Tests `USE_DEMO=true` für stubbed Supabase/Stripe Flows.
