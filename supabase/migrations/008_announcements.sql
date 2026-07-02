-- Super_admin broadcasts announcements visible to all owners.
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_announcements_created_at on announcements(created_at desc);

-- Per-owner read receipts. Composite PK doubles as the "already marked read" guard.
create table announcement_reads (
  announcement_id uuid not null references announcements(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, owner_id)
);

create index idx_announcement_reads_owner on announcement_reads(owner_id);

alter table announcements enable row level security;
alter table announcement_reads enable row level security;

create policy "authenticated users can view all announcements"
  on announcements for select
  using (auth.uid() is not null);

-- Reuses is_super_admin() (migration 004) rather than inlining a fresh
-- exists(select ... from profiles) subquery, which is exactly the RLS
-- self-recursion bug that migration fixed.
create policy "super_admin can create announcements"
  on announcements for insert
  with check (is_super_admin());

create policy "owners view their own read receipts"
  on announcement_reads for select
  using (owner_id = auth.uid());

create policy "owners create their own read receipts"
  on announcement_reads for insert
  with check (owner_id = auth.uid());

create policy "super_admin sees all read receipts"
  on announcement_reads for select
  using (is_super_admin());
