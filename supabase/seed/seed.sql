-- Seed base salon, admin user and reference data
-- Admin user credentials: admin@schnittwerk.test / ChangeMe123!

insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, last_sign_in_at, raw_user_meta_data, raw_app_meta_data, aud, role)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@schnittwerk.test',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  now(),
  jsonb_build_object('name', 'Salon Admin'),
  jsonb_build_object('provider', 'email', 'providers', array['email']),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@schnittwerk.test'),
  'email',
  now(),
  now(),
  now()
) on conflict (id) do nothing;

-- Salon
insert into public.salons (id, name, tagline, street, postal_code, city, phone, email)
values (
  '11111111-1111-1111-1111-111111111111',
  'Schnittwerk by Vanessa Carosella',
  'Luxuriöse Schnitte und Color in St. Gallen',
  'Poststrasse 1',
  '9000',
  'St. Gallen',
  '+41 71 000 00 00',
  'kontakt@schnittwerk.test'
) on conflict (id) do nothing;

-- Profile linked to auth user
insert into public.profiles (id, salon_id, first_name, last_name, phone, preferred_language, marketing_opt_in)
values (
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Vanessa',
  'Carosella',
  '+41 71 000 00 00',
  'de-CH',
  false
) on conflict (id) do update set salon_id = excluded.salon_id;

-- Staff owner row
insert into public.staff (id, salon_id, profile_id, role, display_name, title, bio)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'owner',
  'Vanessa Carosella',
  'Inhaberin & Master Stylist',
  'Spezialisiert auf präzise Schnitte und moderne Farbtechniken.'
) on conflict (id) do nothing;

-- Customer record for the owner so bookings work in dev
insert into public.customers (id, profile_id, salon_id, preferred_language)
values (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'de-CH'
) on conflict (id) do nothing;

-- Reference services
insert into public.service_categories (id, salon_id, name, description, position)
values
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Hair',
    'Schnitt, Styling und Coloration',
    1
  )
on conflict (id) do nothing;

insert into public.services (id, salon_id, category_id, name, description, duration_minutes, buffer_minutes, price_chf)
values
  (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'Haarschnitt & Föhnen',
    'Personalisierter Schnitt inkl. Beratung und Styling.',
    60,
    10,
    120.00
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'Glossing',
    'Glanzauffrischung als Ergänzung zum Schnitt.',
    30,
    5,
    55.00
  )
on conflict (id) do nothing;

-- Sample appointment
insert into public.appointments (id, salon_id, customer_id, staff_id, service_id, start_at, end_at, status, price_chf, notes)
values (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  timezone('Europe/Zurich', now() + interval '2 days'),
  timezone('Europe/Zurich', now() + interval '2 days' + interval '1 hour 10 minutes'),
  'scheduled',
  120.00,
  'Ersttermin zum Kennenlernen'
) on conflict (id) do nothing;

-- Shop Produkte
insert into public.products (id, salon_id, slug, name, description, price_chf, badges)
values
  (
    '88888888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    'intense-care-mask',
    'Intense Care Mask',
    'Reparierende Maske mit Bonding-Komplex für geschädigtes Haar.',
    48.00,
    array['Vegan','Repair','Salon-only']
  ),
  (
    '99999999-9999-9999-9999-999999999999',
    '11111111-1111-1111-1111-111111111111',
    'glow-finishing-oil',
    'Glow Finishing Oil',
    'Leichtes Öl für Glanz und Hitzeschutz.',
    36.00,
    array['Heatcare','Anti-Frizz']
  )
on conflict (id) do nothing;

insert into public.product_stock (product_id, salon_id, stock_on_hand, reserved)
values
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 12, 0),
  ('99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 18, 0)
on conflict (product_id) do nothing;
