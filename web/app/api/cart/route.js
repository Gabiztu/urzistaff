import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CART_COOKIE = 'cart_token';

function genToken() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function getCartByToken(token) {
  if (!token) return { data: null, error: null };
  const { data, error } = await supabase
    .from('carts')
    .select('id, guest_token')
    .eq('guest_token', token)
    .maybeSingle();
  return { data, error };
}

async function createCartWithToken(token) {
  const { data, error } = await supabase
    .from('carts')
    .insert({ guest_token: token, status: 'active' })
    .select('id, guest_token')
    .single();
  return { data, error };
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(CART_COOKIE)?.value;
    if (!token) return NextResponse.json({ cart: null }, { status: 200 });
    const { data, error } = await getCartByToken(token);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ cart: null }, { status: 200 });

    // fetch items
    const { data: items, error: itemsErr } = await supabase
      .from('cart_items')
      .select('id, listing_id, name, headline, price, created_at')
      .eq('cart_id', data.id)
      .order('created_at', { ascending: true });
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 });

    return NextResponse.json({ cart: { id: data.id, items: items || [] } }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    let token = cookieStore.get(CART_COOKIE)?.value;

    // If no existing cart, create one
    let cart;
    if (token) {
      const { data } = await getCartByToken(token);
      cart = data;
    }
    if (!cart) {
      token = genToken();
      const { data, error } = await createCartWithToken(token);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      cart = data;
    }

    const res = NextResponse.json({ cart: { id: cart.id } });
    // Refresh cookie
    res.cookies.set({
      name: CART_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
