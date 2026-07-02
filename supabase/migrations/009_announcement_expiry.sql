-- Announcements can now have a deadline (expires_at) after which they stop
-- showing to owners, and super_admin can manually stop one early
-- (is_active=false) or delete it outright.
alter table announcements add column if not exists expires_at timestamptz;
alter table announcements add column if not exists is_active boolean not null default true;

-- Previously announcements had no update/delete policy at all (append-only
-- v1). Reuses is_super_admin() consistently with every other super_admin
-- policy in this schema.
create policy "super_admin can update announcements"
  on announcements for update
  using (is_super_admin());

create policy "super_admin can delete announcements"
  on announcements for delete
  using (is_super_admin());
