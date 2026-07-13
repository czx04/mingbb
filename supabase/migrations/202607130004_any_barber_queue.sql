-- Keep "any barber" appointments unassigned until reception assigns a barber.
alter table public.appointments
  add column if not exists requested_service_id uuid references public.services(id) on delete set null;

update public.appointments appointment
set requested_service_id = (
  select snapshot.service_id
  from public.appointment_services snapshot
  where snapshot.appointment_id = appointment.id
  order by snapshot.sort_order, snapshot.created_at
  limit 1
)
where appointment.requested_service_id is null
  and exists (select 1 from public.appointment_services snapshot where snapshot.appointment_id = appointment.id);

create index if not exists idx_appointments_unassigned_queue
  on public.appointments(location_id, starts_at, ends_at)
  where barber_id is null and status not in ('cancelled', 'no_show', 'completed');

create or replace function public.enforce_appointment_slot_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_per_barber integer;
  current_barber_bookings integer;
  current_total_bookings integer;
  eligible_barbers integer;
  expected_minutes integer;
begin
  if new.status in ('cancelled', 'no_show') then
    return new;
  end if;

  select capacity_per_barber, booking_slot_minutes
  into allowed_per_barber, expected_minutes
  from public.location_settings
  where location_id = new.location_id;

  allowed_per_barber := coalesce(allowed_per_barber, 2);
  expected_minutes := coalesce(expected_minutes, 60);

  if new.ends_at <> new.starts_at + make_interval(mins => expected_minutes) then
    raise exception 'Khung đặt lịch phải kéo dài % phút', expected_minutes using errcode = 'P0001';
  end if;

  -- All specific and unassigned bookings share the same shop capacity for this window.
  perform pg_advisory_xact_lock(
    hashtextextended(new.location_id::text || '|' || new.starts_at::text || '|' || new.ends_at::text, 0)
  );

  select count(distinct shift.barber_id)
  into eligible_barbers
  from public.work_shifts shift
  join public.barbers barber on barber.id = shift.barber_id and barber.active and barber.archived_at is null
  join public.barber_locations location on location.barber_id = barber.id
    and location.location_id = new.location_id and location.active
  where shift.location_id = new.location_id
    and shift.starts_at <= new.starts_at
    and shift.ends_at >= new.ends_at
    and (
      new.requested_service_id is null
      or exists (
        select 1 from public.barber_services skill
        where skill.barber_id = shift.barber_id
          and skill.service_id = new.requested_service_id
          and skill.active
      )
    );

  select count(*)
  into current_total_bookings
  from public.appointments appointment
  where appointment.location_id = new.location_id
    and appointment.starts_at = new.starts_at
    and appointment.ends_at = new.ends_at
    and appointment.status not in ('cancelled', 'no_show')
    and appointment.id <> new.id;

  if eligible_barbers = 0 or current_total_bookings >= eligible_barbers * allowed_per_barber then
    raise exception 'Khung giờ này đã đủ khách' using errcode = 'P0001';
  end if;

  if new.barber_id is not null then
    if not exists (
      select 1
      from public.work_shifts shift
      where shift.location_id = new.location_id
        and shift.barber_id = new.barber_id
        and shift.starts_at <= new.starts_at
        and shift.ends_at >= new.ends_at
    ) then
      raise exception 'Barber không có ca làm trong khung giờ này' using errcode = 'P0001';
    end if;

    select count(*)
    into current_barber_bookings
    from public.appointments appointment
    where appointment.location_id = new.location_id
      and appointment.barber_id = new.barber_id
      and appointment.starts_at = new.starts_at
      and appointment.ends_at = new.ends_at
      and appointment.status not in ('cancelled', 'no_show')
      and appointment.id <> new.id;

    if current_barber_bookings >= allowed_per_barber then
      raise exception 'Barber đã đủ % khách trong khung giờ này', allowed_per_barber using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;
