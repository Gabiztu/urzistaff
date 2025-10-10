-- Add per-listing purchase price used for checkout/cart totals
alter table if exists public.listings
  add column if not exists purchase_price numeric;

-- Backfill existing listings to 99 by default
update public.listings set purchase_price = 99 where purchase_price is null;

-- Optional: constrain values to 49 or 99
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'listings' and constraint_name = 'listings_purchase_price_chk'
  ) then
    alter table public.listings
      add constraint listings_purchase_price_chk
      check (purchase_price in (49, 99));
  end if;
end $$;
