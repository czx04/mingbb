-- A booking window is an arrival window. Each barber accepts up to N customers per window.
alter table public.location_settings
  add column if not exists booking_slot_minutes smallint not null default 60
  check (booking_slot_minutes between 15 and 240);

alter table public.location_settings
  add column if not exists capacity_per_barber smallint not null default 2
  check (capacity_per_barber between 1 and 20);

update public.location_settings
set booking_slot_minutes = 60,
    capacity_per_barber = 2
where location_id = '00000000-0000-4000-8000-000000000001';

alter table public.appointments
  drop constraint if exists appointments_barber_id_tstzrange_excl;

create index if not exists idx_appointments_slot_capacity
  on public.appointments(location_id, barber_id, starts_at, ends_at)
  where status not in ('cancelled', 'no_show');

create or replace function public.enforce_appointment_slot_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_capacity integer;
  current_bookings integer;
  expected_minutes integer;
begin
  if new.barber_id is null or new.status in ('cancelled', 'no_show') then
    return new;
  end if;

  select capacity_per_barber, booking_slot_minutes
  into allowed_capacity, expected_minutes
  from public.location_settings
  where location_id = new.location_id;

  allowed_capacity := coalesce(allowed_capacity, 2);
  expected_minutes := coalesce(expected_minutes, 60);

  if new.ends_at <> new.starts_at + make_interval(mins => expected_minutes) then
    raise exception 'Khung đặt lịch phải kéo dài % phút', expected_minutes using errcode = 'P0001';
  end if;

  -- Serializes concurrent bookings for the same barber and window.
  perform pg_advisory_xact_lock(
    hashtextextended(new.barber_id::text || '|' || new.starts_at::text || '|' || new.ends_at::text, 0)
  );

  select count(*)
  into current_bookings
  from public.appointments appointment
  where appointment.location_id = new.location_id
    and appointment.barber_id = new.barber_id
    and appointment.starts_at = new.starts_at
    and appointment.ends_at = new.ends_at
    and appointment.status not in ('cancelled', 'no_show')
    and appointment.id <> new.id;

  if current_bookings >= allowed_capacity then
    raise exception 'Khung giờ này đã đủ % khách cho barber', allowed_capacity using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_enforce_slot_capacity on public.appointments;
create trigger appointments_enforce_slot_capacity
before insert or update on public.appointments
for each row execute function public.enforce_appointment_slot_capacity();
