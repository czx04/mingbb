-- Friendly five-character referral codes, e.g. TUAN7, MINH2, KHOA8.
create extension if not exists unaccent with schema extensions;

create or replace function public.generate_friendly_referral_code(p_full_name text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  last_name text;
  base_four text;
  base_three text;
  candidate text;
  start_digit integer;
  offset_value integer;
begin
  last_name := upper(regexp_replace(extensions.unaccent(trim(coalesce(p_full_name, 'MING'))), '^.*[[:space:]]+', ''));
  last_name := regexp_replace(last_name, '[^A-Z0-9]', '', 'g');
  base_four := rpad(substr(coalesce(nullif(last_name, ''), 'MING'), 1, 4), 4, 'X');
  base_three := substr(base_four, 1, 3);

  -- Avoid two concurrent customers with the same name choosing the same suffix.
  perform pg_advisory_xact_lock(hashtextextended('referral|' || base_four, 0));
  start_digit := floor(random() * 10)::integer;

  for offset_value in 0..9 loop
    candidate := base_four || ((start_digit + offset_value) % 10)::text;
    if not exists (select 1 from public.customers where upper(referral_code) = candidate) then
      return candidate;
    end if;
  end loop;

  -- Fallback for more than ten customers sharing the same first-name prefix.
  start_digit := floor(random() * 100)::integer;
  for offset_value in 0..99 loop
    candidate := base_three || lpad(((start_digit + offset_value) % 100)::text, 2, '0');
    if not exists (select 1 from public.customers where upper(referral_code) = candidate) then
      return candidate;
    end if;
  end loop;

  raise exception 'Không thể tạo mã giới thiệu duy nhất' using errcode = 'P0001';
end;
$$;

create or replace function public.set_friendly_customer_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.referral_code is null or upper(new.referral_code) !~ '^[A-Z0-9]{5}$' then
    new.referral_code := public.generate_friendly_referral_code(new.full_name);
  else
    new.referral_code := upper(new.referral_code);
  end if;
  return new;
end;
$$;

alter table public.customers alter column referral_code drop default;

drop trigger if exists customers_set_friendly_referral_code on public.customers;
create trigger customers_set_friendly_referral_code
before insert or update of full_name, referral_code on public.customers
for each row execute function public.set_friendly_customer_referral_code();

-- Convert existing long codes to the new format. The trigger generates each value.
update public.customers
set referral_code = null
where referral_code is null or upper(referral_code) !~ '^[A-Z0-9]{5}$';

alter table public.customers
  drop constraint if exists customers_referral_code_format;
alter table public.customers
  add constraint customers_referral_code_format
  check (referral_code ~ '^[A-Z0-9]{5}$');
