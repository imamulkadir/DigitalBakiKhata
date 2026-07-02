alter table profiles add column if not exists failed_pin_attempts integer not null default 0;
alter table profiles add column if not exists pin_locked_until timestamptz;
