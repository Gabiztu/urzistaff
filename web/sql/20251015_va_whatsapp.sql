-- Add admin-only VA WhatsApp contact field to listings
alter table if exists public.listings
  add column if not exists va_whatsapp text;

comment on column public.listings.va_whatsapp is 'Admin-only: VA WhatsApp contact (e.g., +407xxxxxxxx). Not exposed publicly.';
