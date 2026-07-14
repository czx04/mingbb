-- MING closes at 19:30. Cap existing future shifts and recurring templates so
-- the public booking API does not expose appointment windows after closing.
update public.work_shift_templates
set ends_at = '19:30'::time,
    updated_at = now()
where ends_at > '19:30'::time
  and starts_at < '19:30'::time;

update public.work_shifts
set ends_at = (
      ((starts_at at time zone 'Asia/Ho_Chi_Minh')::date + '19:30'::time)
      at time zone 'Asia/Ho_Chi_Minh'
    ),
    updated_at = now()
where (starts_at at time zone 'Asia/Ho_Chi_Minh')::date >=
      (now() at time zone 'Asia/Ho_Chi_Minh')::date
  and (ends_at at time zone 'Asia/Ho_Chi_Minh')::time > '19:30'::time
  and (starts_at at time zone 'Asia/Ho_Chi_Minh')::time < '19:30'::time;
