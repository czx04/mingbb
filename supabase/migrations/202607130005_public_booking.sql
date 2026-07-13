-- Public website booking support. Website appointments use fixed arrival windows,
-- while total_duration_minutes keeps the actual sum of the selected services.

alter table public.appointments
  add column if not exists requested_service_ids uuid[] not null default '{}'::uuid[];

update public.appointments appointment
set requested_service_ids = array[
  coalesce(
    appointment.requested_service_id,
    (
      select snapshot.service_id
      from public.appointment_services snapshot
      where snapshot.appointment_id = appointment.id
        and snapshot.service_id is not null
      order by snapshot.sort_order, snapshot.created_at
      limit 1
    )
  )
]
where cardinality(appointment.requested_service_ids) = 0
  and (
    appointment.requested_service_id is not null
    or exists (
      select 1
      from public.appointment_services snapshot
      where snapshot.appointment_id = appointment.id
        and snapshot.service_id is not null
    )
  );

create unique index if not exists customers_referral_code_ci_unique
  on public.customers(lower(referral_code))
  where referral_code is not null;

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
  requested_ids uuid[];
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
  requested_ids := case
    when cardinality(new.requested_service_ids) > 0 then new.requested_service_ids
    when new.requested_service_id is not null then array[new.requested_service_id]
    else '{}'::uuid[]
  end;

  if new.ends_at <> new.starts_at + make_interval(mins => expected_minutes) then
    raise exception 'Khung đặt lịch phải kéo dài % phút', expected_minutes using errcode = 'P0001';
  end if;

  -- All specific and unassigned bookings share the same shop capacity for a window.
  perform pg_advisory_xact_lock(
    hashtextextended(new.location_id::text || '|' || new.starts_at::text || '|' || new.ends_at::text, 0)
  );

  select count(distinct shift.barber_id)
  into eligible_barbers
  from public.work_shifts shift
  join public.barbers barber
    on barber.id = shift.barber_id
    and barber.active
    and barber.archived_at is null
  join public.barber_locations location
    on location.barber_id = barber.id
    and location.location_id = new.location_id
    and location.active
  where shift.location_id = new.location_id
    and shift.starts_at <= new.starts_at
    and shift.ends_at >= new.ends_at
    and not exists (
      select 1
      from unnest(requested_ids) requested(service_id)
      where not exists (
        select 1
        from public.barber_services skill
        where skill.barber_id = shift.barber_id
          and skill.service_id = requested.service_id
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
        and not exists (
          select 1
          from unnest(requested_ids) requested(service_id)
          where not exists (
            select 1
            from public.barber_services skill
            where skill.barber_id = shift.barber_id
              and skill.service_id = requested.service_id
              and skill.active
          )
        )
    ) then
      raise exception 'Barber không có ca làm hoặc không thực hiện đủ dịch vụ trong khung giờ này' using errcode = 'P0001';
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

create or replace function public.create_website_booking(
  p_date date,
  p_time time,
  p_service_ids uuid[],
  p_barber_id uuid,
  p_full_name text,
  p_phone text,
  p_referral_code text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  fixed_location_id constant uuid := '00000000-0000-4000-8000-000000000001';
  settings public.location_settings%rowtype;
  local_today date;
  starts_at_value timestamptz;
  ends_at_value timestamptz;
  normalized_phone text;
  normalized_services uuid[];
  service_count integer;
  total_duration integer;
  subtotal integer;
  customer_id_value uuid;
  customer_referrer_id uuid;
  existing_referrer_id uuid;
  appointment_id_value uuid;
  booking_code_value text;
  generated_referral_code text;
begin
  select * into settings
  from public.location_settings
  where location_id = fixed_location_id;

  if not found then
    raise exception 'Chi nhánh chưa được cấu hình' using errcode = 'P0001';
  end if;

  local_today := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  if p_date < local_today or p_date >= local_today + settings.booking_window_days then
    raise exception 'Ngày đặt lịch nằm ngoài khoảng cho phép' using errcode = 'P0001';
  end if;

  starts_at_value := (p_date + p_time) at time zone 'Asia/Ho_Chi_Minh';
  ends_at_value := starts_at_value + make_interval(mins => settings.booking_slot_minutes);
  if starts_at_value <= now() then
    raise exception 'Khung giờ này đã qua' using errcode = 'P0001';
  end if;

  normalized_phone := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if normalized_phone !~ '^0[0-9]{9}$' then
    raise exception 'Số điện thoại không hợp lệ' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Họ tên không hợp lệ' using errcode = 'P0001';
  end if;

  select array_agg(distinct service_id order by service_id)
  into normalized_services
  from unnest(coalesce(p_service_ids, '{}'::uuid[])) service_id;

  if coalesce(cardinality(normalized_services), 0) = 0 then
    raise exception 'Vui lòng chọn ít nhất một dịch vụ' using errcode = 'P0001';
  end if;

  select count(*), sum(coalesce(location.duration_override, service.duration_minutes)), sum(coalesce(location.price_override, service.price_amount))
  into service_count, total_duration, subtotal
  from public.services service
  join public.service_locations location
    on location.service_id = service.id
    and location.location_id = fixed_location_id
    and location.active
  where service.id = any(normalized_services)
    and service.active
    and service.archived_at is null;

  if service_count <> cardinality(normalized_services) then
    raise exception 'Có dịch vụ không còn hoạt động' using errcode = 'P0001';
  end if;
  if total_duration > 1440 then
    raise exception 'Tổng thời lượng dịch vụ vượt quá giới hạn' using errcode = 'P0001';
  end if;

  if p_barber_id is not null and not exists (
    select 1
    from public.barbers barber
    join public.barber_locations location
      on location.barber_id = barber.id
      and location.location_id = fixed_location_id
      and location.active
    join public.work_shifts shift
      on shift.barber_id = barber.id
      and shift.location_id = fixed_location_id
      and shift.starts_at <= starts_at_value
      and shift.ends_at >= ends_at_value
    where barber.id = p_barber_id
      and barber.active
      and barber.archived_at is null
      and not exists (
        select 1
        from unnest(normalized_services) requested(service_id)
        where not exists (
          select 1
          from public.barber_services skill
          where skill.barber_id = barber.id
            and skill.service_id = requested.service_id
            and skill.active
        )
      )
  ) then
    raise exception 'Barber không còn phù hợp với lịch đã chọn' using errcode = 'P0001';
  end if;

  -- Serialize first-time customer/referral creation for the same phone number.
  perform pg_advisory_xact_lock(hashtextextended('customer|' || normalized_phone, 0));

  generated_referral_code := 'MG' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.customers (full_name, phone, referral_code)
  values (trim(p_full_name), normalized_phone, generated_referral_code)
  on conflict (phone) do nothing;

  select id, referred_by_customer_id
  into customer_id_value, existing_referrer_id
  from public.customers
  where phone = normalized_phone;

  if nullif(trim(coalesce(p_referral_code, '')), '') is not null then
    select id into customer_referrer_id
    from public.customers
    where lower(referral_code) = lower(trim(p_referral_code));

    if customer_referrer_id is null then
      raise exception 'Mã giới thiệu không tồn tại' using errcode = 'P0001';
    end if;
    if customer_referrer_id = customer_id_value then
      raise exception 'Bạn không thể dùng mã giới thiệu của chính mình' using errcode = 'P0001';
    end if;
    if existing_referrer_id is not null and existing_referrer_id <> customer_referrer_id then
      raise exception 'Khách hàng đã có người giới thiệu' using errcode = 'P0001';
    end if;
    if existing_referrer_id is null and exists (
      select 1 from public.appointments where customer_id = customer_id_value
    ) then
      raise exception 'Mã giới thiệu chỉ áp dụng cho lần đặt đầu tiên' using errcode = 'P0001';
    end if;

    update public.customers
    set referred_by_customer_id = customer_referrer_id
    where id = customer_id_value
      and referred_by_customer_id is null;
  end if;

  insert into public.appointments (
    location_id,
    customer_id,
    barber_id,
    requested_service_id,
    requested_service_ids,
    starts_at,
    ends_at,
    source,
    customer_note,
    total_duration_minutes,
    subtotal_amount
  )
  values (
    fixed_location_id,
    customer_id_value,
    p_barber_id,
    normalized_services[1],
    normalized_services,
    starts_at_value,
    ends_at_value,
    'website',
    nullif(trim(coalesce(p_note, '')), ''),
    total_duration,
    subtotal
  )
  returning id, booking_code into appointment_id_value, booking_code_value;

  insert into public.appointment_services (
    appointment_id,
    service_id,
    service_name,
    duration_minutes,
    unit_price,
    sort_order
  )
  select
    appointment_id_value,
    service.id,
    service.name,
    coalesce(location.duration_override, service.duration_minutes),
    coalesce(location.price_override, service.price_amount),
    array_position(p_service_ids, service.id)
  from public.services service
  join public.service_locations location
    on location.service_id = service.id
    and location.location_id = fixed_location_id
    and location.active
  where service.id = any(normalized_services)
  order by array_position(p_service_ids, service.id);

  return jsonb_build_object(
    'databaseId', appointment_id_value,
    'bookingCode', booking_code_value,
    'status', 'pending',
    'startsAt', starts_at_value,
    'endsAt', ends_at_value,
    'totalDurationMinutes', total_duration,
    'subtotalAmount', subtotal,
    'barberId', p_barber_id
  );
end;
$$;

revoke all on function public.create_website_booking(date, time, uuid[], uuid, text, text, text, text) from public;
revoke all on function public.create_website_booking(date, time, uuid[], uuid, text, text, text, text) from anon;
revoke all on function public.create_website_booking(date, time, uuid[], uuid, text, text, text, text) from authenticated;
grant execute on function public.create_website_booking(date, time, uuid[], uuid, text, text, text, text) to service_role;
