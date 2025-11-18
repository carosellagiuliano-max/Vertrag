# Security & RLS (Phase 1 → 6)

RLS ist auf allen Tabellen aktiviert. Policies nutzen `auth.uid()` für Nutzerbezug und `auth.role()` für Service-Rollen. Phase 4 nutzt Server Actions mit Service-Role-Key, um Buchungen zu persistieren – ohne Client-Exposure des Keys. Fallback-Demo-Modus schreibt nur in Memory.

## Richtlinien pro Tabelle

### salons
- **Select**: offen für `anon`, `authenticated` und `service_role` für öffentliche Daten wie Öffnungszeiten/Leistungen.

### profiles
- **Select/Insert/Update**: `auth.uid() = id` erlaubt Nutzenden, ihr Profil anzulegen und zu pflegen.
- **All**: `service_role` darf alles (Edge Functions / Jobs).

### staff
- **Select**: eigenes Staff-Profil `auth.uid() = profile_id`.
- **All**: `service_role` für administrative Aufgaben.

### customers
- **Select/Insert/Update**: Nutzer*innen dürfen nur den eigenen Kundendatensatz (Match `profile_id`).
- **All**: `service_role` für Systemaufgaben.

### service_categories & services
- **Select**: `using (true)` für öffentliche Anzeige auf Marketing- und Buchungsseiten.
- **All**: `service_role` für Pflege via Backoffice/Seed.

### appointments
- **Select**: Kunden sehen eigene Termine (über Join zu `customers.profile_id`). Mitarbeitende sehen alle Termine ihres Salons.
- **Insert/Update**: Kunden dürfen eigene Termine anlegen/ändern. Feinere Statusregeln folgen in späteren Phasen.
- **All**: `service_role` für Administrative/Backoffice-Funktionen.

### products / product_stock
- **Select (products)**: öffentlich für Shop-Listing.
- **All (products & product_stock)**: nur `service_role` (Admin/Jobs pflegen Katalog & Lagerstand).

### orders / order_items
- **Select**: Kunden sehen nur Bestellungen, die über ihren Customer-Eintrag laufen (`customers.profile_id = auth.uid()`).
- **All**: `service_role` verwaltet Orders (Checkout, Stornos, Fulfillment). Kein direkter Client-Zugriff.

### Kundenportal & Actions (Phase 5)
- `bookAppointmentAction` ruft Supabase nur serverseitig auf. Ohne ENV bleibt alles im Demo-Store.
- `checkoutAction` schreibt Orders und Order-Items mit Service-Role. Ohne Supabase wird Demo-Lager reduziert und Bestellung im Memory gespeichert.
- Portal-Listings nutzen Service Role zum Lesen zukünftiger Termine und Bestellungen des eingeloggten Accounts (per E-Mail Lookup). Storno setzt `status = cancelled` und `cancelled_at`.

## PII-Mapping
- **profiles**: Name, Avatar-URL, Kontaktdaten (PII) – Zugriff nur für Betroffene, Admin per Service-Rolle.
- **customers**: Adresse, Telefonnummer, Präferenzen (PII) – nur Eigenzugriff; Admin via Service-Rolle.
- **appointments**: Bezug zu Kund*innen und Mitarbeitenden, Zeitfenster (personenbezogene Metadaten). Zugriff wie oben.
- **orders/order_items**: Rechnungsinformationen (PII), keine Klartext-Zahlungsdaten (Stripe Token). Zugriff für Betroffene und Service-Rolle.
- **staff**: Rollen/Verfügbarkeit (personenbezogene Arbeitsdaten) – nur eigene Einsicht plus Service-Rolle.

## Audit Logging & Nachvollziehbarkeit (Phase 6/7c)
- Unified `audit_logs` table (Phase 6): `id`, `table_name`, `record_id`, `action` (INSERT/UPDATE/DELETE), `old_data`/`new_data` (jsonb), `user_id`, `salon_id`, `created_at`.
- Generic `handle_audit()` trigger function logs full row changes (OLD/NEW) automatically.
- **Triggers** (AFTER INSERT/UPDATE/DELETE FOR EACH ROW):
  - Phase 6: `notification_templates`, `vouchers`, `loyalty_tiers`, `loyalty_accounts`, `loyalty_transactions`.
  - Phase 7c: Core tables `appointments`, `orders`, `customers`, `services`, `products`.
- RLS on `audit_logs`: `salon_users_read` (staff via `salon_id`), `service_role_full`.
- Enforcement layer for compliance; no PII in logs beyond references.

## Datenexport und -löschung
- **Export**: Service-Action `exportAccountData(profile_id)` erzeugt ZIP mit JSON/CSV aus `profiles`, `customers`, `appointments`, `orders` und legt sie als signierte URL in Supabase Storage ab.
- **Löschung/Anonymisierung**: `deleteAccount(profile_id)` entfernt Portal-Zugang, anonymisiert Termin- und Order-Referenzen (`customer_id` nullen, Namen hashen) und löscht Medien/Avatare. Audit-Eintrag dokumentiert Vorgang.
- **Fristen**: Export auf Anfrage innerhalb 30 Tagen; Löschungen unmittelbar nach Verifikation und ohne Wiederherstellungsoption.

## Offene Punkte für kommende Phasen
- RBAC über dedizierte Rollen- und User-Rollen-Tabellen.
- Striktere Update-Regeln (z.B. kein Zurücksetzen abgeschlossener Termine, Stornierungsfenster).

### notification_templates
- [`salon_users_read notification_templates`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:120) `SELECT` using (
  exists (
    select 1 from public.staff s
    where s.salon_id = notification_templates.salon_id
      and s.profile_id = auth.uid()
  )
)
- [`service_role_full notification_templates`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:129) `ALL` using (auth.role() = 'service_role')

### audit_logs
- [`salon_users_read audit_logs`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:133) `SELECT` using (
  exists (
    select 1 from public.staff s
    where s.salon_id = audit_logs.salon_id
      and s.profile_id = auth.uid()
  )
)
- [`service_role_full audit_logs`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:142) `ALL` using (auth.role() = 'service_role')

### vouchers
- [`salon_users_read vouchers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:146) `SELECT` using (
  exists (
    select 1 from public.staff s
    where s.salon_id = vouchers.salon_id
      and s.profile_id = auth.uid()
  )
)
- [`service_role_full vouchers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:155) `ALL` using (auth.role() = 'service_role')

### loyalty_tiers
- [`salon_users_read loyalty_tiers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:159) `SELECT` using (
  exists (
    select 1 from public.staff s
    where s.salon_id = loyalty_tiers.salon_id
      and s.profile_id = auth.uid()
  )
)
- [`service_role_full loyalty_tiers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:168) `ALL` using (auth.role() = 'service_role')

### loyalty_accounts
- [`customers_read_own_loyalty_accounts`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:172) `SELECT` using (
  auth.uid() = (
    select c.profile_id from public.customers c
    where c.id = loyalty_accounts.customer_id
  )
)
- [`salon_users_read loyalty_accounts`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:180) `SELECT` using (
  exists (
    select 1 from public.staff s
    where s.salon_id = loyalty_accounts.salon_id
      and s.profile_id = auth.uid()
  )
)
- [`customers_update_own_loyalty_accounts`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:189) `UPDATE` using/check (
  auth.uid() = (
    select c.profile_id from public.customers c
    where c.id = loyalty_accounts.customer_id
  )
)
- [`service_role_full loyalty_accounts`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:203) `ALL` using (auth.role() = 'service_role')

### loyalty_transactions
- [`customers_read_own_loyalty_transactions`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:207) `SELECT` using (
  exists (
    select 1 from public.loyalty_accounts la
    join public.customers c on la.customer_id = c.id
    where la.id = loyalty_transactions.account_id
      and c.profile_id = auth.uid()
  )
)
- [`salon_users_read loyalty_transactions`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:217) `SELECT` using (
  exists (
    select 1 from public.staff s
    join public.loyalty_accounts la on la.salon_id = s.salon_id
    where la.id = loyalty_transactions.account_id
      and s.profile_id = auth.uid()
  )
)
- [`service_role_full loyalty_transactions`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:227) `ALL` using (auth.role() = 'service_role')
