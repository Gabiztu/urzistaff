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
    .select('id, guest_token, status')
    .eq('guest_token', token)
    .maybeSingle();
  return { data, error };
}

export async function POST() {
  try {
    const store = await cookies();
    const token = store.get(CART_COOKIE)?.value;
    const { data: cart } = await getCartByToken(token);
    if (!cart) return NextResponse.json({ ok: true }); // Nothing to clear

    // Remove all items from this cart
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

    // Optionally mark cart cleared/completed (do not delete cart so cookie remains valid)
    await supabase
      .from('carts')
      .update({ status: 'cleared' })
      .eq('id', cart.id);

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
