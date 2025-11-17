# Operations Runbook

Dieser Runbook beschreibt Abläufe für Betrieb, Störungen und Compliance.

## Umgebungen
- **Local**: Developer-Setup mit Supabase lokal, Stripe Test Keys, Demo-Daten aktivierbar.
- **Staging**: Vollständige Supabase-Instanz mit Test-Stripe; dient Integrationstests (inkl. RLS) und UAT.
- **Production**: EU/CH gehostete Supabase, Stripe Live Keys, Demo-Daten deaktiviert.

## Deploy
1. `npm run lint && npm run typecheck && npm test && npm run build`
2. GitHub Actions CI muss grün sein.
3. Deploy per `vercel --prod` oder Supabase Edge Functions via `supabase functions deploy` (falls genutzt).
4. Nach Deploy: Smoke-Test Marketing-Seite, Buchungsflow, Kundenportal-Login und Shop-Checkout.

## RLS & Auth Checks
- Policies werden in Supabase gepflegt; nach Migration `supabase db diff` und `supabase db reset --seed supabase/seed/test` für Tests.
- Admin-Funktionen nur mit `service_role` oder dedizierter Admin-Rolle. Kein Client darf Service-Role-Key erhalten.

## Backups & Wiederherstellung
- Supabase Point-in-Time-Recovery aktivieren; tägliche Backups prüfen.
- Monatlicher Restore-Test in Staging: Backup einspielen, Smoke-Tests fahren.

## Incident Response
1. **Erkennung**: Monitoringtickets oder Nutzer-Meldungen erfassen (Zeiten, betroffene Funktionen).
2. **Eindämmung**: Feature-Flags deaktivieren oder Demo-Modus aktivieren, um Schreibzugriffe zu stoppen.
3. **Analyse**: Logs und Audit-Tabellen prüfen (Profil-, Termin-, Order-Änderungen). PII nur intern teilen.
4. **Behebung**: Patch entwickeln, Tests laufen lassen, Hotfix deployen.
5. **Nachbereitung**: Postmortem mit Ursache, Impact, Fix, Prävention; Datenschutz-Meldung binnen 72h prüfen.

## Datenschutz & Rechte
- **PII-Mapping** siehe unten; Zugriff nach Need-to-Know, Minimierung beachten.
- **Export**: Nutzer können Profildaten, Termine, Bestellungen über Service-Action `exportAccountData(profile_id)` erhalten; erzeugt JSON/CSV und signierte Download-URL in Supabase Storage.
- **Löschung**: `deleteAccount(profile_id)` löscht Portal-Zugang, anonymisiert Termine/Bestellungen (z.B. `customer_id` nullen, Namen hashen) und entfernt Medien aus Storage; irreversible Aktion mit Audit-Eintrag.

## Observability
- App-Logs: Next.js / Edge Functions logging mit Request-ID und `salon_id` Kontext.
- Metriken: 4 Golden Signals (Latency, Traffic, Errors, Saturation) erfassen; Stripe Webhooks und Supabase Function Fehler monitoren.
- Alerting: Fehler >1% oder Latenz >2s in Kernpfaden triggert Pager.

## Wartung & Jobs
- Geplante Tasks (Cron/Supabase Scheduler): Erinnerungsmails, No-Show-Handling, Lager-Sync. Jobs idempotent halten.
- Änderungen an Feature-Flags dokumentieren; Default-Werte in `.env.example` pflegen.

## Checkliste vor größeren Änderungen
- Datenmigration rückspielbar? (`supabase db revert`)
- RLS-Tests vorhanden/aktualisiert?
- Datenschutzfolgenabschätzung nötig? (bei neuen PII-Feldern)
- Runbook-Abschnitte aktualisieren (Deploy, Incident, Export/Löschung).
