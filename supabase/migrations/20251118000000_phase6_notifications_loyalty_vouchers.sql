-- Phase 6a: Notification templates, audit logs, vouchers, loyalty accounts/tiers/transactions

-- notification_templates
create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  type text not null,
  channel text not null,
  language text not null,
  subject text,
  body_html text,
  body_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(salon_id, type, channel, language)
);

create index if not exists idx_notification_templates_type_language
  on public.notification_templates(type, language);

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  salon_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs (table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_salon_created
  ON public.audit_logs (salon_id, created_at DESC)
  WHERE salon_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON public.audit_logs (user_id)
  WHERE user_id IS NOT NULL;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.handle_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id,
    salon_id
  )
  VALUES (
    TG_TABLE_NAME::text,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id::uuid
      ELSE NEW.id::uuid
    END,
    TG_OP::text,
    CASE
      WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD)::jsonb
      ELSE NULL::jsonb
    END,
    CASE
      WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::jsonb
      ELSE NULL::jsonb
    END,
    auth.uid(),
    CASE
      WHEN TG_TABLE_NAME = 'loyalty_transactions' THEN
        (SELECT la.salon_id FROM public.loyalty_accounts la
         WHERE la.id = CASE WHEN TG_OP = 'DELETE' THEN OLD.account_id::uuid ELSE NEW.account_id::uuid END
         LIMIT 1)
      WHEN TG_OP = 'DELETE' THEN OLD.salon_id::uuid
      WHEN NEW.salon_id IS NOT NULL THEN NEW.salon_id::uuid
      ELSE NULL::uuid
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for Phase6 tables
DO $$
BEGIN
  -- notification_templates
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_notification_templates_trigger' AND tgrelid = 'public.notification_templates'::regclass
  ) THEN
    CREATE TRIGGER audit_notification_templates_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.notification_templates
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- vouchers
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_vouchers_trigger' AND tgrelid = 'public.vouchers'::regclass
  ) THEN
    CREATE TRIGGER audit_vouchers_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.vouchers
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- loyalty_tiers
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_loyalty_tiers_trigger' AND tgrelid = 'public.loyalty_tiers'::regclass
  ) THEN
    CREATE TRIGGER audit_loyalty_tiers_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_tiers
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- loyalty_accounts
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_loyalty_accounts_trigger' AND tgrelid = 'public.loyalty_accounts'::regclass
  ) THEN
    CREATE TRIGGER audit_loyalty_accounts_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_accounts
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;

  -- loyalty_transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'audit_loyalty_transactions_trigger' AND tgrelid = 'public.loyalty_transactions'::regclass
  ) THEN
    CREATE TRIGGER audit_loyalty_transactions_trigger
      AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_transactions
      FOR EACH ROW EXECUTE FUNCTION public.handle_audit();
  END IF;
END $$;

-- vouchers
create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  code text not null unique,
  type text not null check (type in ('fixed', 'percent')),
  value numeric(10,2) not null check (value > 0),
  max_uses integer check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- loyalty_tiers
create table if not exists public.loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  name text not null,
  threshold_points integer not null default 0 check (threshold_points >= 0),
  benefits jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- loyalty_accounts
create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  salon_id uuid not null references public.salons(id) on delete cascade,
  points integer not null default 0 check (points >= 0),
  tier_id uuid references public.loyalty_tiers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(customer_id, salon_id)
);

-- loyalty_transactions
create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.loyalty_accounts(id) on delete cascade,
  points_delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_vouchers_salon on public.vouchers(salon_id);
create index if not exists idx_vouchers_code on public.vouchers(code);
create index if not exists idx_loyalty_tiers_salon on public.loyalty_tiers(salon_id);
create index if not exists idx_loyalty_accounts_customer on public.loyalty_accounts(customer_id);
create index if not exists idx_loyalty_accounts_salon on public.loyalty_accounts(salon_id);
create index if not exists idx_loyalty_transactions_account on public.loyalty_transactions(account_id);

-- Triggers
create trigger set_timestamp_notification_templates
  before update on public.notification_templates
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_vouchers
  before update on public.vouchers
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_loyalty_tiers
  before update on public.loyalty_tiers
  for each row execute procedure public.set_updated_at();

create trigger set_timestamp_loyalty_accounts
  before update on public.loyalty_accounts
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.notification_templates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.vouchers enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;

-- Policies: salon_users_read (staff read salon-scoped data), service_role_full
-- notification_templates: salon staff read, service full
create policy "salon_users_read notification_templates" on public.notification_templates
  for select using (
    exists (
      select 1 from public.staff s
      where s.salon_id = notification_templates.salon_id
        and s.profile_id = auth.uid()
    )
  );

create policy "service_role_full notification_templates" on public.notification_templates
  for all using (auth.role() = 'service_role');

-- audit_logs: salon staff read own salon, service full
create policy "salon_users_read audit_logs" on public.audit_logs
  for select using (
    exists (
      select 1 from public.staff s
      where s.salon_id = audit_logs.salon_id
        and s.profile_id = auth.uid()
    )
  );

create policy "service_role_full audit_logs" on public.audit_logs
  for all using (auth.role() = 'service_role');

-- vouchers: salon staff read, service full
create policy "salon_users_read vouchers" on public.vouchers
  for select using (
    exists (
      select 1 from public.staff s
      where s.salon_id = vouchers.salon_id
        and s.profile_id = auth.uid()
    )
  );

create policy "service_role_full vouchers" on public.vouchers
  for all using (auth.role() = 'service_role');

-- loyalty_tiers: salon staff read, service full
create policy "salon_users_read loyalty_tiers" on public.loyalty_tiers
  for select using (
    exists (
      select 1 from public.staff s
      where s.salon_id = loyalty_tiers.salon_id
        and s.profile_id = auth.uid()
    )
  );

create policy "service_role_full loyalty_tiers" on public.loyalty_tiers
  for all using (auth.role() = 'service_role');

-- loyalty_accounts: customers own + salon staff read salon + service full
create policy "customers_read_own_loyalty_accounts" on public.loyalty_accounts
  for select using (
    auth.uid() = (
      select c.profile_id from public.customers c
      where c.id = loyalty_accounts.customer_id
    )
  );

create policy "salon_users_read loyalty_accounts" on public.loyalty_accounts
  for select using (
    exists (
      select 1 from public.staff s
      where s.salon_id = loyalty_accounts.salon_id
        and s.profile_id = auth.uid()
    )
  );

create policy "customers_update_own_loyalty_accounts" on public.loyalty_accounts
  for update using (
    auth.uid() = (
      select c.profile_id from public.customers c
      where c.id = loyalty_accounts.customer_id
    )
  )
  with check (
    auth.uid() = (
      select c.profile_id from public.customers c
      where c.id = loyalty_accounts.customer_id
    )
  );

create policy "service_role_full loyalty_accounts" on public.loyalty_accounts
  for all using (auth.role() = 'service_role');

-- loyalty_transactions: customers own account + salon staff + service
create policy "customers_read_own_loyalty_transactions" on public.loyalty_transactions
  for select using (
    exists (
      select 1 from public.loyalty_accounts la
      join public.customers c on la.customer_id = c.id
      where la.id = loyalty_transactions.account_id
        and c.profile_id = auth.uid()
    )
  );

create policy "salon_users_read loyalty_transactions" on public.loyalty_transactions
  for select using (
    exists (
      select 1 from public.staff s
      join public.loyalty_accounts la on la.salon_id = s.salon_id
      where la.id = loyalty_transactions.account_id
        and s.profile_id = auth.uid()
    )
  );

create policy "service_role_full loyalty_transactions" on public.loyalty_transactions
  for all using (auth.role() = 'service_role');