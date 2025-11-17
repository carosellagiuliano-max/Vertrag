-- Phase 5: Shop, stock und Orders

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  price_chf numeric(10,2) not null check (price_chf >= 0),
  image_url text,
  badges text[] default array[]::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id, slug)
);

create table if not exists public.product_stock (
  product_id uuid primary key references public.products(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  stock_on_hand integer not null default 0 check (stock_on_hand >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null check (status in ('pending','paid','cancelled','fulfilled')),
  total_chf numeric(10,2) not null default 0,
  currency text not null default 'CHF',
  stripe_session_id text,
  stripe_payment_intent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price_chf numeric(10,2) not null check (unit_price_chf >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_salon on public.products(salon_id);
create index if not exists idx_product_stock_salon on public.product_stock(salon_id);
create index if not exists idx_orders_salon on public.orders(salon_id);
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_order_items_order on public.order_items(order_id);

create trigger set_timestamp_products
before update on public.products
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_product_stock
before update on public.product_stock
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_orders
before update on public.orders
for each row
execute procedure public.set_updated_at();

create trigger set_timestamp_order_items
before update on public.order_items
for each row
execute procedure public.set_updated_at();

alter table public.products enable row level security;
alter table public.product_stock enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Public read products" on public.products
for select using (true);

create policy "Service role manages products" on public.products
for all using (auth.role() = 'service_role');

create policy "Service role manages stock" on public.product_stock
for all using (auth.role() = 'service_role');

create policy "Customers read own orders" on public.orders
for select using (
  exists (
    select 1 from public.customers c
    where c.id = customer_id and c.profile_id = auth.uid()
  )
);

create policy "Service role manages orders" on public.orders
for all using (auth.role() = 'service_role');

create policy "Customers read own order items" on public.order_items
for select using (
  exists (
    select 1
    from public.orders o
    join public.customers c on o.customer_id = c.id
    where o.id = order_id and c.profile_id = auth.uid()
  )
);

create policy "Service role manages order items" on public.order_items
for all using (auth.role() = 'service_role');
