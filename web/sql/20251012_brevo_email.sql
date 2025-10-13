-- Orders email + guide send tracking
alter table if exists public.orders add column if not exists email text;
alter table if exists public.orders add column if not exists guide_email_sent_at timestamptz;
alter table if exists public.orders add column if not exists guide_email_message_id text;
alter table if exists public.orders add column if not exists guide_email_error text;

create index if not exists orders_guide_email_sent_idx on public.orders (guide_email_sent_at);
