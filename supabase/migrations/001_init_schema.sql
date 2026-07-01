-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ROLES
create type user_role as enum ('super_admin', 'owner', 'staff');
create type account_status as enum ('pending_approval', 'active', 'rejected', 'suspended');
create type subscription_status as enum ('active', 'due_soon', 'overdue');
create type payment_claim_status as enum ('pending', 'confirmed', 'rejected');

-- PROFILES
create table profiles (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null check (phone_number ~ '^\+8801[3-9][0-9]{8}$'),
  pin_hash text not null,
  role user_role not null default 'owner',
  status account_status not null default 'pending_approval',
  shop_name text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  subscription_status subscription_status default 'active',
  last_paid_date date,
  next_due_date date,
  expo_push_token text
);

-- CUSTOMERS
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  photo_url text,
  voice_tag_url text,
  fallback_label text,
  phone_number text,
  created_at timestamptz not null default now()
);

-- TRANSACTIONS
create type transaction_type as enum ('owes', 'paid');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  type transaction_type not null,
  voice_note_url text,
  created_at timestamptz not null default now()
);

-- PAYMENT CLAIMS
create table payment_claims (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  amount numeric(10,2) not null default 100,
  status payment_claim_status not null default 'pending',
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz
);

-- customer_balances view
create view customer_balances as
  select
    c.id as customer_id,
    c.owner_id,
    c.photo_url,
    c.voice_tag_url,
    c.fallback_label,
    c.phone_number,
    c.created_at,
    coalesce(sum(case when t.type = 'owes' then t.amount else 0 end), 0)
      - coalesce(sum(case when t.type = 'paid' then t.amount else 0 end), 0) as balance
  from customers c
  left join transactions t on t.customer_id = c.id
  group by c.id;

-- Indexes
create index idx_customers_owner on customers(owner_id);
create index idx_transactions_customer on transactions(customer_id);
create index idx_transactions_owner on transactions(owner_id);
create index idx_payment_claims_owner on payment_claims(owner_id);
create index idx_profiles_status on profiles(status);
