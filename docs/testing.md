# Testing Leitfaden

Dieser Leitfaden bündelt die Teststrategie für Schnittwerk nach codex.md.

## Ziele
- Business-Regeln und RLS-Policies verlässlich absichern.
- Sicherheits- und Datenschutz-Pflichten (DSG/DSGVO) prüfbar machen.
- Entwickler*innen klare Commands an die Hand geben, die lokal wie in CI laufen.

## Testpyramide
- **Unit**: reine Domänenfunktionen (z.B. Buchungsregeln, Voucher, Loyalty, Notifications). Schnell, deterministisch.
- **Integration**: Supabase-Zugriffe mit Service-Role sowie RLS-Policies. Nutzt Testdatenbank mit `seed/test`-Daten und führt Policies mit echten Rollen aus.
- **Flow-/E2E-Smoke**: Kernpfade Marketing → Buchung → Portal → Shop Checkout als minimaler End-to-End-Check; optional mit Playwright gegen lokale Dev-Instanz.

## Commands
- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck`
- **Unit-Tests**: `npm test`
- **Integration (DB/RLS)**: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run test:db`
- **Build Smoke**: `npm run build`

Die CI-Pipeline führt Lint, Typecheck, Unit-Tests und Build standardmäßig aus. Integrationstests können per Workflow-Dispatch aktiviert werden, weil sie eine laufende Test-Datenbank benötigen.

## Einrichtung für Integrationstests
- Starte Supabase lokal (`supabase start`) oder nutze eine dedizierte Test-Instanz.
- Spiele die Seeds ein: `supabase db reset --db-url $SUPABASE_URL --password $POSTGRES_PASSWORD --seed supabase/seed/test`
- Lege Testrollen an (`anon`, `authenticated`, `service_role`) gemäß Supabase-Standard; Policies werden dadurch erzwungen.

## Abdeckungserwartung
- **RLS**: Jede Tabelle mit Policy erhält mindestens einen Allow- und einen Deny-Fall pro Rolle.
- **Domain-Regeln**: Happy- und Edge-Cases (z.B. Storno-Fenster, No-Show, Gutschein-Limits, Loyalitätslevel).
- **Flows**: Mindestens ein Buchungspfad und ein Checkout-Pfad werden als Smoke-Test ausgeführt; Ergebnis ist erfolgreiches Anlegen des Datensatzes oder ein erwarteter Fehler.

## Reporting
- Vitest schreibt JUnit-XML nach `./reports/unit.xml` (CI-Artefakt).
- Integrationstests schreiben nach `./reports/integration.xml`.
- Coverage kann bei Bedarf mit `vitest run --coverage` aktiviert werden; aktuell optional, weil der Fokus auf RLS-Korrektheit liegt.

## Troubleshooting
- **Type-Fehler**: Stelle sicher, dass `node` und `tsconfig.json` aufeinander abgestimmt sind; `npm run typecheck -- --traceResolution` hilft bei Modulpfaden.
- **RLS schlägt fehl**: Prüfe, ob die JWT-Rolle korrekt gesetzt ist (`supabase.auth.admin.generateLink()` oder `supabase.auth.signInWithPassword`).
- **Flaky E2E**: Zeitliche Puffer (`await page.waitForSelector`) erhöhen und lokale Netzwerk-Proxy-Variablen entfernen.
