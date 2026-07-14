-- MING booking core
-- Designed for multiple locations, per-barber schedules, service snapshots and future reporting.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type public.appointment_status as enum (
    'pending', 'confirmed', 'in_service', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.appointment_source as enum ('website', 'admin', 'phone', 'walk_in');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.staff_role as enum ('owner', 'manager', 'receptionist', 'barber');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  phone text,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.location_settings (
  location_id uuid primary key references public.locations(id) on delete cascade,
  booking_window_days smallint not null default 30 check (booking_window_days between 1 and 365),
  slot_interval_minutes smallint not null default 15 check (slot_interval_minutes between 5 and 120),
  booking_slot_minutes smallint not null default 60 check (booking_slot_minutes between 15 and 240),
  capacity_per_barber smallint not null default 2 check (capacity_per_barber between 1 and 20),
  buffer_minutes smallint not null default 0 check (buffer_minutes between 0 and 120),
  require_confirmation boolean not null default true,
  allow_any_barber boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.staff_role not null default 'receptionist',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_locations (
  staff_id uuid not null references public.staff_profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (staff_id, location_id)
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  bio text,
  initials text not null check (char_length(initials) between 1 and 3),
  color text not null default 'blue',
  active boolean not null default true,
  sort_order integer not null default 0,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.barber_locations (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  active boolean not null default true,
  primary key (barber_id, location_id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  duration_minutes smallint not null check (duration_minutes between 5 and 720),
  price_amount integer not null check (price_amount >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_locations (
  service_id uuid not null references public.services(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  active boolean not null default true,
  price_override integer check (price_override is null or price_override >= 0),
  duration_override smallint check (duration_override is null or duration_override between 5 and 720),
  primary key (service_id, location_id)
);

create table if not exists public.barber_services (
  barber_id uuid not null references public.barbers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  active boolean not null default true,
  primary key (barber_id, service_id)
);

-- Optional recurring templates. Daily work_shifts remain the source of truth for bookable time.
create table if not exists public.work_shift_templates (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  barber_id uuid not null references public.barbers(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  effective_from date,
  effective_until date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check (effective_until is null or effective_from is null or effective_from <= effective_until)
);

create table if not exists public.work_shifts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  barber_id uuid not null references public.barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  source_template_id uuid references public.work_shift_templates(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  exclude using gist (barber_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  referral_code text,
  referred_by_customer_id uuid references public.customers(id) on delete set null,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique default ('MG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  location_id uuid not null references public.locations(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete restrict,
  barber_id uuid references public.barbers(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'pending',
  source public.appointment_source not null default 'website',
  customer_note text,
  internal_note text,
  total_duration_minutes smallint not null check (total_duration_minutes between 5 and 1440),
  subtotal_amount integer not null default 0 check (subtotal_amount >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  total_amount integer generated always as (greatest(subtotal_amount - discount_amount, 0)) stored,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at),
  check ((status not in ('cancelled', 'no_show')) or cancelled_at is not null)
);

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 720),
  unit_price integer not null check (unit_price >= 0),
  quantity smallint not null default 1 check (quantity between 1 and 20),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment_status_history (
  id bigint generated always as identity primary key,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references public.staff_profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_shifts_location_time on public.work_shifts(location_id, starts_at, ends_at);
create index if not exists idx_work_shifts_barber_time on public.work_shifts(barber_id, starts_at, ends_at);
create index if not exists idx_appointments_location_time on public.appointments(location_id, starts_at, ends_at);
create index if not exists idx_appointments_barber_time on public.appointments(barber_id, starts_at, ends_at);
create index if not exists idx_appointments_customer_time on public.appointments(customer_id, starts_at desc);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_status_history_appointment on public.appointment_status_history(appointment_id, created_at desc);

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
drop trigger if exists location_settings_set_updated_at on public.location_settings;
create trigger location_settings_set_updated_at before update on public.location_settings for each row execute function public.set_updated_at();
drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;
create trigger staff_profiles_set_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();
drop trigger if exists barbers_set_updated_at on public.barbers;
create trigger barbers_set_updated_at before update on public.barbers for each row execute function public.set_updated_at();
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();
drop trigger if exists work_shift_templates_set_updated_at on public.work_shift_templates;
create trigger work_shift_templates_set_updated_at before update on public.work_shift_templates for each row execute function public.set_updated_at();
drop trigger if exists work_shifts_set_updated_at on public.work_shifts;
create trigger work_shifts_set_updated_at before update on public.work_shifts for each row execute function public.set_updated_at();
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at before update on public.appointments for each row execute function public.set_updated_at();

create or replace function public.log_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.appointment_status_history (appointment_id, from_status, to_status)
    values (new.id, case when tg_op = 'UPDATE' then old.status else null end, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_log_status on public.appointments;
create trigger appointments_log_status after insert or update on public.appointments for each row execute function public.log_appointment_status_change();

alter table public.locations enable row level security;
alter table public.location_settings enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_locations enable row level security;
alter table public.barbers enable row level security;
alter table public.barber_locations enable row level security;
alter table public.services enable row level security;
alter table public.service_locations enable row level security;
alter table public.barber_services enable row level security;
alter table public.work_shift_templates enable row level security;
alter table public.work_shifts enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_status_history enable row level security;

-- Initial location and catalog. Fixed UUIDs make local fixtures and API tests deterministic.
insert into public.locations (id, name, slug, timezone, active)
values ('00000000-0000-4000-8000-000000000001', 'MING Barber', 'ming-barber', 'Asia/Ho_Chi_Minh', true)
on conflict (id) do update set name = excluded.name, timezone = excluded.timezone, active = excluded.active;

insert into public.location_settings (location_id, booking_window_days, slot_interval_minutes, booking_slot_minutes, capacity_per_barber, buffer_minutes)
values ('00000000-0000-4000-8000-000000000001', 30, 15, 60, 2, 0)
on conflict (location_id) do nothing;

insert into public.barbers (id, name, slug, bio, initials, color, sort_order)
values
  ('00000000-0000-4000-8000-000000000101', 'Minh', 'minh', '5 năm kinh nghiệm', 'M', 'blue', 1),
  ('00000000-0000-4000-8000-000000000102', 'Khoa', 'khoa', 'Chuyên fade & styling', 'K', 'orange', 2)
on conflict (id) do update set name = excluded.name, bio = excluded.bio, initials = excluded.initials, color = excluded.color;

insert into public.barber_locations (barber_id, location_id)
select id, '00000000-0000-4000-8000-000000000001'::uuid from public.barbers
where id in ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102')
on conflict do nothing;

insert into public.services (id, name, slug, duration_minutes, price_amount, sort_order)
values
  ('00000000-0000-4000-8000-000000000201', 'Cắt tóc', 'cat-toc', 45, 120000, 1),
  ('00000000-0000-4000-8000-000000000202', 'Cạo mặt', 'cao-mat', 30, 80000, 2),
  ('00000000-0000-4000-8000-000000000203', 'Combo chăm sóc', 'combo-cham-soc', 75, 190000, 3)
on conflict (id) do update set name = excluded.name, duration_minutes = excluded.duration_minutes, price_amount = excluded.price_amount;

insert into public.service_locations (service_id, location_id)
select id, '00000000-0000-4000-8000-000000000001'::uuid from public.services
where id in ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000203')
on conflict do nothing;

insert into public.barber_services (barber_id, service_id)
select barber.id, service.id
from public.barbers barber
cross join public.services service
where barber.id in ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000102')
  and service.id in ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000203')
on conflict do nothing;

-- Seed daily shifts for the next 35 days. Tuesday is Khoa's day off; Sunday is Minh's day off.
insert into public.work_shifts (location_id, barber_id, starts_at, ends_at, note)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  barber_id,
  (day::date + start_time) at time zone 'Asia/Ho_Chi_Minh',
  (day::date + end_time) at time zone 'Asia/Ho_Chi_Minh',
  'Ca khởi tạo'
from generate_series(current_date, current_date + 34, interval '1 day') day
cross join (values
  ('00000000-0000-4000-8000-000000000101'::uuid, 0, '09:00'::time, '12:00'::time),
  ('00000000-0000-4000-8000-000000000101'::uuid, 0, '13:30'::time, '19:30'::time),
  ('00000000-0000-4000-8000-000000000102'::uuid, 2, '10:00'::time, '13:00'::time),
  ('00000000-0000-4000-8000-000000000102'::uuid, 2, '14:00'::time, '19:30'::time)
) shift_data(barber_id, day_off, start_time, end_time)
where extract(dow from day) <> day_off
on conflict do nothing;
