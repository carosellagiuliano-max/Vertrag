-- Phase 1: core domain tables, auth links and RLS
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  street text,
  postal_code text,
  city text,
  country text default 'CH',
  phone text,
  email text,
  timezone text not null default 'Europe/Zurich',
  currency text not null default 'CHF',
  default_language text not null default 'de-CH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  salon_id uuid references public.salons(id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text,
  preferred_language text default 'de-CH',
  marketing_opt_in boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('staff','manager','owner')),
  display_name text not null,
  title text,
  bio text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  preferred_language text default 'de-CH',
  marketing_opt_in boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, salon_id)
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id, name)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  buffer_minutes integer not null default 0 check (buffer_minutes >= 0),
  price_chf numeric(10,2) not null check (price_chf >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id, name)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('scheduled','cancelled','completed','no_show')),
  price_chf numeric(10,2) check (price_chf >= 0),
  notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists idx_staff_salon on public.staff(salon_id);
create index if not exists idx_customers_profile on public.customers(profile_id);
create index if not exists idx_customers_salon on public.customers(salon_id);
create index if not exists idx_service_categories_salon on public.service_categories(salon_id);
create index if not exists idx_services_salon on public.services(salon_id);
create index if not exists idx_appointments_salon on public.appointments(salon_id);
create index if not exists idx_appointments_customer on public.appointments(customer_id);
create index if not exists idx_appointments_staff on public.appointments(staff_id);
create index if not exists idx_appointments_start_at on public.appointments(start_at);

create trigger set_timestamp_salons
before update on public.salons
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_profiles
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_staff
before update on public.staff
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_customers
before update on public.customers
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_service_categories
before update on public.service_categories
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_services
before update on public.services
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_appointments
before update on public.appointments
for each row
execute procedure public.set_updated_at();

-- RLS
alter table public.salons enable row level security;
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.customers enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- salons policies
create policy "Authenticated can read salons" on public.salons
for select
using (auth.role() = 'authenticated' or auth.role() = 'service_role' or auth.role() = 'anon');

-- profiles policies
create policy "Users manage own profile" on public.profiles
for select using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Service role manages profiles" on public.profiles
for all using (auth.role() = 'service_role');

-- staff policies
create policy "Staff read own row" on public.staff
for select using (auth.uid() = profile_id);

create policy "Service role manages staff" on public.staff
for all using (auth.role() = 'service_role');

-- customers policies
create policy "Users read their customer profile" on public.customers
for select using (auth.uid() = profile_id);

create policy "Users update their customer profile" on public.customers
for update using (auth.uid() = profile_id)
with check (auth.uid() = profile_id);

create policy "Users create their customer profile" on public.customers
for insert with check (auth.uid() = profile_id);

create policy "Service role manages customers" on public.customers
for all using (auth.role() = 'service_role');

-- service categories policies
create policy "Public read service categories" on public.service_categories
for select using (true);

create policy "Service role manages service categories" on public.service_categories
for all using (auth.role() = 'service_role');

-- services policies
create policy "Public read services" on public.services
for select using (true);

create policy "Service role manages services" on public.services
for all using (auth.role() = 'service_role');

-- appointments policies
create policy "Customers read own appointments" on public.appointments
for select using (auth.uid() = (select c.profile_id from public.customers c where c.id = customer_id));

create policy "Staff read salon appointments" on public.appointments
for select using (exists (
  select 1 from public.staff s
  where s.salon_id = appointments.salon_id
    and s.profile_id = auth.uid()
));

create policy "Customers manage own appointments" on public.appointments
for insert with check (auth.uid() = (select c.profile_id from public.customers c where c.id = customer_id));

create policy "Customers update their appointments" on public.appointments
for update using (auth.uid() = (select c.profile_id from public.customers c where c.id = customer_id))
with check (auth.uid() = (select c.profile_id from public.customers c where c.id = customer_id));

create policy "Service role manages appointments" on public.appointments
for all using (auth.role() = 'service_role');
