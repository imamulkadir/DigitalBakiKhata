alter table profiles enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table payment_claims enable row level security;

-- PROFILES policies
create policy "users can view their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "super_admin can view all profiles"
  on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create policy "super_admin can update any profile"
  on profiles for update
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create policy "users can update their own non-sensitive fields"
  on profiles for update
  using (id = auth.uid());

-- CUSTOMERS policies
create policy "owners see only their own customers"
  on customers for select
  using (owner_id = auth.uid());

create policy "owners manage only their own customers"
  on customers for insert with check (owner_id = auth.uid());

create policy "owners update only their own customers"
  on customers for update using (owner_id = auth.uid());

create policy "super_admin sees all customers"
  on customers for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- TRANSACTIONS policies
create policy "owners see only their own transactions"
  on transactions for select using (owner_id = auth.uid());

create policy "owners insert only their own transactions"
  on transactions for insert with check (owner_id = auth.uid());

create policy "super_admin sees all transactions"
  on transactions for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- PAYMENT CLAIMS policies
create policy "owners see and create only their own payment claims"
  on payment_claims for select using (owner_id = auth.uid());

create policy "owners create their own payment claims"
  on payment_claims for insert with check (owner_id = auth.uid());

create policy "super_admin sees and confirms all payment claims"
  on payment_claims for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'super_admin'));
