-- Reservations and sales lifecycle for listings
-- Run this in Supabase SQL editor

-- Columns on listings
alter table if exists public.listings add column if not exists reserved_by_order uuid;
alter table if exists public.listings add column if not exists reserved_until timestamptz;
alter table if exists public.listings add column if not exists sold_by_order uuid;
alter table if exists public.listings add column if not exists sold_at timestamptz;

-- Helpful indexes
create index if not exists listings_reserved_until_idx on public.listings (reserved_until);
create index if not exists listings_sold_by_order_idx on public.listings (sold_by_order);

-- Reserve all provided listing ids for a single order in an all-or-nothing way
create or replace function public.reserve_listings(
  p_order uuid,
  p_listing_ids uuid[],
  p_hold_minutes int default 10
) returns boolean
language plpgsql
security definer
as $$
declare
  needed int := coalesce(array_length(p_listing_ids, 1), 0);
  hold interval := make_interval(mins => p_hold_minutes);
  cnt int;
begin
  if needed = 0 then
    return true;
  end if;

  -- Lock eligible rows and verify we can reserve all of them
  with candidates as (
    select id
    from public.listings
    where id = any(p_listing_ids)
      and sold_by_order is null
      and (reserved_until is null or reserved_until < now())
    for update
  )
  select count(*) into cnt from candidates;

  if cnt <> needed then
    raise exception 'reserve_conflict';
  end if;

  update public.listings
  set reserved_by_order = p_order,
      reserved_until = now() + hold
  where id = any(p_listing_ids);

  return true;
end;
$$;

-- Extend the current hold for an order's listings
create or replace function public.extend_hold(
  p_order uuid,
  p_listing_ids uuid[],
  p_extend_minutes int default 20
) returns boolean
language sql
security definer
as $$
  update public.listings
  set reserved_until = greatest(coalesce(reserved_until, now()), now()) + make_interval(mins => p_extend_minutes)
  where id = any(p_listing_ids)
    and sold_by_order is null
    and reserved_by_order = p_order;
  select exists (
    select 1 from public.listings
    where id = any(p_listing_ids) and reserved_by_order = p_order
  );
$$;
