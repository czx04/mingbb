-- Ensure every customer, including customers created by reception, has a member/referral code.

alter table public.customers
  alter column referral_code set default ('MG' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));

update public.customers
set referral_code = 'MG' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where referral_code is null;
