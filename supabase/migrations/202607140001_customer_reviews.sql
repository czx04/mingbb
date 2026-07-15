-- Keep one general service review per customer, independent of individual appointments.

create table if not exists public.customer_reviews (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_reviews_updated_at
  on public.customer_reviews(updated_at desc);

drop trigger if exists customer_reviews_set_updated_at on public.customer_reviews;
create trigger customer_reviews_set_updated_at
before update on public.customer_reviews
for each row execute function public.set_updated_at();

alter table public.customer_reviews enable row level security;
