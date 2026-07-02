alter table profiles add column if not exists pin_reset_required boolean not null default false;
