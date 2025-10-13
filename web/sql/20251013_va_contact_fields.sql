-- Add admin-only VA contact fields to listings
alter table if exists public.listings
  add column if not exists va_email text,
  add column if not exists va_telegram text;

-- Optional: comments for clarity
comment on column public.listings.va_email is 'Admin-only: VA contact email, used in client emails. Not exposed publicly.';
comment on column public.listings.va_telegram is 'Admin-only: VA contact Telegram handle (e.g., @username). Not exposed publicly.';
