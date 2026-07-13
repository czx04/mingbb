-- Preserve historical appointment references while allowing catalog items to disappear from operations.
alter table public.services add column if not exists archived_at timestamptz;
alter table public.barbers add column if not exists archived_at timestamptz;

create index if not exists idx_services_active_catalog on public.services(sort_order) where archived_at is null;
create index if not exists idx_barbers_active_catalog on public.barbers(sort_order) where archived_at is null;
