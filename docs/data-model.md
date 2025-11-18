# Datenmodell Phase 1 → Phase 6 Nutzung

Kernobjekte (Salon, Profile, Mitarbeitende, Kunden, Leistungen, Termine) bleiben unverändert. Phase 4 nutzt sie für den Buchungs-Flow: Service-Role-Server-Action legt Profile/Kunden an, speichert Termine und liest sie fürs Portal. Ohne Supabase laufen dieselben Strukturen in einem Demo-In-Memory-Store.

## Tabellen

### salons
- **id** `uuid` PK, `gen_random_uuid()`
- **name** `text` (required)
- **tagline**, **street**, **postal_code**, **city**, **country** (default `CH`), **phone**, **email`
- **timezone** `text` default `Europe/Zurich`
- **currency** `text` default `CHF`
- **default_language** `text` default `de-CH`
- **created_at**, **updated_at** `timestamptz`

### profiles
- **id** `uuid` PK, FK -> `auth.users.id`
- **salon_id** FK -> `salons.id` (nullable für zukünftige Multi-Salon-Zuordnung)
- **first_name**, **last_name** `text` (required)
- **phone** `text`
- **preferred_language** `text` default `de-CH`
- **marketing_opt_in** `boolean` default `false`
- **created_at**, **updated_at** `timestamptz`

### staff
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **profile_id** FK -> `profiles.id` (unique)
- **role** `text` check in (`staff`, `manager`, `owner`)
- **display_name** `text`, **title** `text`, **bio** `text`
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`

### customers
- **id** `uuid` PK
- **profile_id** FK -> `profiles.id`
- **salon_id** FK -> `salons.id`
- **preferred_language** `text` default `de-CH`
- **marketing_opt_in** `boolean` default `false`
- **created_at**, **updated_at** `timestamptz`

### service_categories
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **name** `text` (required, unique per salon)
- **description** `text`
- **position** `int` default `0`
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`

### services
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **category_id** FK -> `service_categories.id` (nullable)
- **name** `text` (required, unique per salon)
- **description** `text`
- **duration_minutes** `int` > 0
- **buffer_minutes** `int` >= 0
- **price_chf** `numeric(10,2)` >= 0
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`

### appointments
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **customer_id** FK -> `customers.id`
- **staff_id** FK -> `staff.id` (nullable)
- **service_id** FK -> `services.id` (nullable)
- **start_at**, **end_at** `timestamptz`
- **status** `text` in (`scheduled`, `cancelled`, `completed`, `no_show`)
- **price_chf** `numeric(10,2)` >= 0
- **notes**, **cancellation_reason** `text`
- **cancelled_at** `timestamptz`
- **created_at**, **updated_at** `timestamptz`

### products
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **slug** `text` unique per salon
- **name** `text`
- **description** `text`
- **price_chf** `numeric(10,2)` >= 0
- **image_url** `text`
- **badges** `text[]`
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`

### product_stock
- **product_id** `uuid` PK, FK -> `products.id`
- **salon_id** FK -> `salons.id`
- **stock_on_hand** `int` >= 0
- **reserved** `int` >= 0
- **created_at**, **updated_at** `timestamptz`

### orders
- **id** `uuid` PK
- **salon_id** FK -> `salons.id`
- **customer_id** FK -> `customers.id`
- **status** `text` in (`pending`, `paid`, `cancelled`, `fulfilled`)
- **total_chf** `numeric(10,2)`
- **currency** `text` default `CHF`
- **stripe_session_id**, **stripe_payment_intent** `text`
- **created_at**, **updated_at** `timestamptz`

### order_items
- **id** `uuid` PK
- **order_id** FK -> `orders.id`
- **product_id** FK -> `products.id`
- **quantity** `int` > 0
- **unit_price_chf** `numeric(10,2)`
- **created_at**, **updated_at** `timestamptz`

## Indizes
- Phase 1-5: Salon- und Join-Indizes auf `salon_id`, `profile_id`, `customer_id`, `staff_id` sowie `start_at` für Terminabfragen.
- Phase 6:
  - [`idx_notification_templates_type_language`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:19) `(type, language)`
  - [`idx_audit_logs_table_record`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:LINES) `(table_name, record_id)`
  - [`idx_audit_logs_salon_created`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:LINES) `(salon_id, created_at DESC) WHERE salon_id IS NOT NULL`
  - [`idx_audit_logs_user`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:LINES) `(user_id) WHERE user_id IS NOT NULL`
  - [`idx_vouchers_salon`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:86) `(salon_id)`
  - [`idx_vouchers_code`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:87) `(code)`
  - [`idx_loyalty_tiers_salon`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:88) `(salon_id)`
  - [`idx_loyalty_accounts_customer`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:89) `(customer_id)`
  - [`idx_loyalty_accounts_salon`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:90) `(salon_id)`
  - [`idx_loyalty_transactions_account`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:91) `(account_id)`

## Zeitstempel-Trigger
- Phase 1-5: Alle Tabellen mit `updated_at` nutzen `public.set_updated_at()`.
- Phase 6: Zusätzlich [`set_timestamp_notification_templates`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:94), [`set_timestamp_vouchers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:98), [`set_timestamp_loyalty_tiers`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:102), [`set_timestamp_loyalty_accounts`](supabase/migrations/20251118000000_phase6_notifications_loyalty_vouchers.sql:106) vor Updates.

## Seed-Daten
- Admin-User `admin@schnittwerk.test` mit Profil, Staff-Eintrag (Owner) und Customer-Datensatz.
- Salon "Schnittwerk by Vanessa Carosella" in St. Gallen.
- Kategorie "Hair" plus Services "Haarschnitt & Föhnen" und "Glossing".
- Beispieltermin zwei Tage in der Zukunft.
- Shop-Produkte "Intense Care Mask" und "Glow Finishing Oil" inkl. Lagerbestand.

### notification_templates
- **id** `uuid` PK, `gen_random_uuid()`
- **salon_id** `uuid` FK -> `salons.id`
- **type** `text` (required)
- **channel** `text` (required)
- **language** `text` (required)
- **subject** `text`
- **body_html** `text`
- **body_text** `text`
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`
- Unique: `(salon_id, type, channel, language)`

### audit_logs (strict unified schema)
- **id** `uuid` PK, `gen_random_uuid()`
- **table_name** `text` NOT NULL
- **record_id** `uuid` NOT NULL
- **action** `text` NOT NULL CHECK (`action` IN ('INSERT', 'UPDATE', 'DELETE'))
- **old_data** `jsonb`
- **new_data** `jsonb`
- **user_id** `uuid` REFERENCES `auth.users(id)`
- **salon_id** `uuid`
- **created_at** `timestamptz` DEFAULT `now()` NOT NULL

### vouchers
- **id** `uuid` PK, `gen_random_uuid()`
- **salon_id** `uuid` FK -> `salons.id`
- **code** `text` unique
- **type** `text` check in (`fixed`, `percent`)
- **value** `numeric(10,2)` > 0
- **max_uses** `integer` > 0
- **used_count** `integer` default 0 >= 0
- **expires_at** `timestamptz`
- **active** `boolean` default `true`
- **created_at**, **updated_at** `timestamptz`

### loyalty_tiers
- **id** `uuid` PK, `gen_random_uuid()`
- **salon_id** `uuid` FK -> `salons.id`
- **name** `text` (required)
- **threshold_points** `integer` default 0 >= 0
- **benefits** `jsonb` default `{}`
- **created_at**, **updated_at** `timestamptz`

### loyalty_accounts
- **id** `uuid` PK, `gen_random_uuid()`
- **customer_id** `uuid` FK -> `customers.id`
- **salon_id** `uuid` FK -> `salons.id`
- **points** `integer` default 0 >= 0
- **tier_id** `uuid` FK -> `loyalty_tiers.id`
- **created_at**, **updated_at** `timestamptz`
- Unique: `(customer_id, salon_id)`

### loyalty_transactions
- **id** `uuid` PK, `gen_random_uuid()`
- **account_id** `uuid` FK -> `loyalty_accounts.id`
- **points_delta** `integer`
- **reason** `text` (required)
- **created_at** `timestamptz`

## Audit Triggers
- Generic `public.handle_audit()` function logs INSERT/UPDATE/DELETE to `audit_logs`.
- **Phase6 tables**: `notification_templates`, `vouchers`, `loyalty_tiers`, `loyalty_accounts`, `loyalty_transactions`.
- **Phase7c core tables**: `appointments`, `orders`, `customers`, `services`, `products`.
- Triggers: AFTER INSERT OR UPDATE OR DELETE, idempotent creation via `IF NOT EXISTS`.
