-- The super_admin policies subqueried "profiles" from within a policy on
-- "profiles" itself, which re-triggers RLS evaluation and recurses forever.
-- A security definer function runs as the function owner and bypasses RLS
-- for its internal query, breaking the recursion.
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

drop policy if exists "super_admin can view all profiles" on profiles;
create policy "super_admin can view all profiles"
  on profiles for select
  using (is_super_admin());

drop policy if exists "super_admin can update any profile" on profiles;
create policy "super_admin can update any profile"
  on profiles for update
  using (is_super_admin());

drop policy if exists "super_admin sees all customers" on customers;
create policy "super_admin sees all customers"
  on customers for select
  using (is_super_admin());

drop policy if exists "super_admin sees all transactions" on transactions;
create policy "super_admin sees all transactions"
  on transactions for select
  using (is_super_admin());

drop policy if exists "super_admin sees and confirms all payment claims" on payment_claims;
create policy "super_admin sees and confirms all payment claims"
  on payment_claims for all
  using (is_super_admin());
