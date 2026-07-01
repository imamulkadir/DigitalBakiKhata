-- Overdue owners must stay read-only (view existing data, no new writes).
-- This was only enforced client-side (disabled buttons); any direct API/curl
-- call could bypass it. Enforce it in RLS so it holds regardless of client.
drop policy if exists "owners manage only their own customers" on customers;
create policy "owners manage only their own customers"
  on customers for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.subscription_status is distinct from 'overdue'
    )
  );

drop policy if exists "owners insert only their own transactions" on transactions;
create policy "owners insert only their own transactions"
  on transactions for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and p.subscription_status is distinct from 'overdue'
    )
  );
