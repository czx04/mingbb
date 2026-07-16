-- Make the operational catalogue the single source of truth for the public website.
-- Categories are managed independently so cut, perm, wash and colour services
-- remain clearly separated as the catalogue grows.

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists service_categories_set_updated_at on public.service_categories;
create trigger service_categories_set_updated_at
before update on public.service_categories
for each row execute function public.set_updated_at();

alter table public.services
  add column if not exists category_id uuid references public.service_categories(id) on delete set null,
  add column if not exists short_description text,
  add column if not exists published boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists online_bookable boolean not null default true,
  add column if not exists price_display_mode text not null default 'fixed';

alter table public.services drop constraint if exists services_price_display_mode_check;
alter table public.services add constraint services_price_display_mode_check
  check (price_display_mode in ('fixed', 'from', 'contact'));

create index if not exists idx_service_categories_catalog
  on public.service_categories(sort_order)
  where archived_at is null;
create index if not exists idx_services_public_catalog
  on public.services(published, featured, sort_order)
  where archived_at is null;
create index if not exists idx_services_category
  on public.services(category_id, sort_order)
  where archived_at is null;

insert into public.service_categories (id, name, slug, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'Cắt tóc', 'cat-toc', 1),
  ('10000000-0000-4000-8000-000000000002', 'Uốn tóc', 'uon-toc', 2),
  ('10000000-0000-4000-8000-000000000003', 'Gội & chăm sóc', 'goi-cham-soc', 3),
  ('10000000-0000-4000-8000-000000000004', 'Nhuộm tóc', 'nhuom-toc', 4),
  ('10000000-0000-4000-8000-000000000005', 'Râu & cạo', 'rau-cao', 5),
  ('10000000-0000-4000-8000-000000000006', 'Tạo kiểu', 'tao-kieu', 6),
  ('10000000-0000-4000-8000-000000000007', 'Combo', 'combo', 7)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  active = true,
  archived_at = null;

update public.services
set category_id = case
  when slug like '%combo%' or lower(name) like '%combo%' then '10000000-0000-4000-8000-000000000007'::uuid
  when slug like '%nhuom%' or lower(name) like '%nhuộm%' or lower(name) like '%tẩy%' or lower(name) like '%phủ bạc%' then '10000000-0000-4000-8000-000000000004'::uuid
  when slug like '%uon%' or lower(name) like '%uốn%' then '10000000-0000-4000-8000-000000000002'::uuid
  when slug like '%goi%' or lower(name) like '%gội%' or lower(name) like '%massage%' or lower(name) like '%dưỡng%' then '10000000-0000-4000-8000-000000000003'::uuid
  when slug like '%cao%' or slug like '%rau%' or lower(name) like '%cạo%' or lower(name) like '%râu%' then '10000000-0000-4000-8000-000000000005'::uuid
  when slug like '%tao-kieu%' or lower(name) like '%tạo kiểu%' or lower(name) like '%styling%' then '10000000-0000-4000-8000-000000000006'::uuid
  else '10000000-0000-4000-8000-000000000001'::uuid
end
where category_id is null;

update public.services
set short_description = coalesce(nullif(short_description, ''), nullif(description, ''),
  case
    when slug = 'cat-toc' then 'Tư vấn kiểu tóc, cắt và tạo kiểu hoàn thiện.'
    when slug = 'cao-mat' then 'Khăn nóng thư giãn và đường cạo sạch gọn.'
    when slug = 'combo-cham-soc' then 'Trải nghiệm chăm sóc trọn vẹn trong một buổi.'
    else name
  end),
  description = coalesce(nullif(description, ''), short_description, name);

with first_four as (
  select id
  from public.services
  where active and archived_at is null
  order by sort_order, created_at
  limit 4
)
update public.services
set featured = true
where id in (select id from first_four)
  and not exists (select 1 from public.services where featured and archived_at is null);

alter table public.service_categories enable row level security;
