# Datenmodell Phase 1 → Phase 4 Nutzung

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
- Salon- und Join-Indizes auf `salon_id`, `profile_id`, `customer_id`, `staff_id` sowie `start_at` für Terminabfragen.

## Zeitstempel-Trigger
Alle Tabellen nutzen `public.set_updated_at()` vor Updates, um `updated_at` konsistent zu pflegen.

## Seed-Daten
- Admin-User `admin@schnittwerk.test` mit Profil, Staff-Eintrag (Owner) und Customer-Datensatz.
- Salon "Schnittwerk by Vanessa Carosella" in St. Gallen.
- Kategorie "Hair" plus Services "Haarschnitt & Föhnen" und "Glossing".
- Beispieltermin zwei Tage in der Zukunft.
- Shop-Produkte "Intense Care Mask" und "Glow Finishing Oil" inkl. Lagerbestand.
