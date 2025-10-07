import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CART_COOKIE = 'cart_token';

async function getCartByToken(token) {
  if (!token) return { data: null, error: null };
  const { data, error } = await supabase
    .from('carts')
    .select('id, guest_token')
    .eq('guest_token', token)
    .maybeSingle();
  return { data, error };
}

export async function POST(request) {
  try {
    const { listing_id, name, headline, price } = await request.json();
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    const cookieStore = cookies();
    const token = cookieStore.get(CART_COOKIE)?.value;
    const { data: cart } = await getCartByToken(token);
    if (!cart) return NextResponse.json({ error: 'cart_not_found' }, { status: 404 });

    // Upsert-like: ensure one entry per listing in this cart
    const { data: existing, error: exErr } = await supabase
      .from('cart_items')
      .select('id, cart_id, listing_id')
      .eq('cart_id', cart.id)
      .eq('listing_id', listing_id)
      .maybeSingle();
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 400 });

    if (existing) {
      return NextResponse.json({ item: existing, duplicated: true }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    const payload = { cart_id: cart.id, listing_id, name: name || null, headline: headline || null, price: Number(price || 0) };
    const { data: item, error } = await supabase
      .from('cart_items')
      .insert(payload)
      .select('id, cart_id, listing_id, name, headline, price')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ item }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const listing_id = searchParams.get('listing_id');
    if (!listing_id) return NextResponse.json({ error: 'listing_id required' }, { status: 400 });
    const token = cookies().get(CART_COOKIE)?.value;
    const { data: cart } = await getCartByToken(token);
    if (!cart) return NextResponse.json({ error: 'cart_not_found' }, { status: 404 });
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('listing_id', listing_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
