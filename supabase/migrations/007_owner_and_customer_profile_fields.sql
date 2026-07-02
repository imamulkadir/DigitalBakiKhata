-- Editable identity fields: owner's own name/photo, and per-customer name/address.
alter table profiles add column if not exists owner_name text;
alter table profiles add column if not exists owner_photo_url text;

alter table customers add column if not exists name text;
alter table customers add column if not exists address text;

drop view if exists customer_balances;
create view customer_balances as
  select
    c.id as customer_id,
    c.owner_id,
    c.photo_url,
    c.voice_tag_url,
    c.fallback_label,
    c.name,
    c.address,
    c.phone_number,
    c.created_at,
    coalesce(sum(case when t.type = 'owes' then t.amount else 0 end), 0)
      - coalesce(sum(case when t.type = 'paid' then t.amount else 0 end), 0) as balance
  from customers c
  left join transactions t on t.customer_id = c.id
  group by c.id;
