-- Create discount_codes table for fixed 10% discounts
create table if not exists public.discount_codes (
  code text primary key,
  discount_pct numeric not null default 0.10,
  created_at timestamptz not null default now()
);

-- Index to speed up lookups by code
create index if not exists discount_codes_code_idx on public.discount_codes (code);

-- Add discount columns to orders to snapshot applied discount
alter table public.orders
  add column if not exists discount_code text,
  add column if not exists discount_pct numeric default 0,
  add column if not exists discount_amount numeric default 0;
