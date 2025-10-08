-- Run this in Supabase SQL editor to support the admin clients view
alter table if exists public.orders add column if not exists address text;
alter table if exists public.orders add column if not exists city text;
alter table if exists public.orders add column if not exists country text;
alter table if exists public.orders add column if not exists region text;
alter table if exists public.orders add column if not exists zip text;
alter table if exists public.orders add column if not exists items jsonb;
alter table if exists public.orders add column if not exists paid_at timestamptz;
alter table if exists public.orders add column if not exists ipn_status text;
alter table if exists public.orders add column if not exists ipn_payload jsonb;

-- Helpful index for listing latest orders
create index if not exists orders_created_at_idx on public.orders (created_at desc);