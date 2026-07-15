-- Allow staff to moderate reviews without deleting customer feedback.

alter table public.customer_reviews
  add column if not exists is_visible boolean not null default true;

create index if not exists idx_customer_reviews_public
  on public.customer_reviews(is_visible, updated_at desc);
