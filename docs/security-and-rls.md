# Security & RLS (Phase 1 → 5)

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

## Offene Punkte für kommende Phasen
- RBAC über dedizierte Rollen- und User-Rollen-Tabellen.
- Striktere Update-Regeln (z.B. kein Zurücksetzen abgeschlossener Termine, Stornierungsfenster).
- Auditing-Tabellen und Logging für Termin- und Profiländerungen.
- Datenschutz: Mapping personenbezogener Felder ergänzen und Export/Löschpfade ausarbeiten.
