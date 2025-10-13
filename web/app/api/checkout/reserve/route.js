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

async function getCartItems(cartId) {
  if (!cartId) return { data: [], error: null };
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, listing_id, name, price')
    .eq('cart_id', cartId);
  return { data: data || [], error };
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CART_COOKIE)?.value;
    const { data: cart } = await getCartByToken(token);
    if (!cart) return NextResponse.json({ error: 'cart_not_found' }, { status: 404 });

    const { data: items } = await getCartItems(cart.id);
    const qty = items.length;
    if (qty === 0) return NextResponse.json({ error: 'cart_empty' }, { status: 400 });

    const snapshotItems = (items || []).map(it => ({
      listing_id: it.listing_id,
      name: it.name ?? null,
      price: Number(it.price || 0) || 0,
    }));
    const subtotal = (snapshotItems || []).reduce((s, it) => s + Number(it.price || 0), 0);
    const listingIds = snapshotItems.map((it) => it.listing_id).filter(Boolean);

    // Reuse existing pending order for this cart if present, otherwise create a minimal pending order
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('cart_id', cart.id)
      .eq('status', 'pending')
      .is('now_invoice_url', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId = existing?.id || null;
    if (!orderId) {
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          cart_id: cart.id,
          item_count: qty,
          items: snapshotItems,
          total: subtotal,
          fiat_amount_usd: subtotal,
          status: 'pending',
        })
        .select('id')
        .single();
      if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 });
      orderId = order.id;
    } else {
      // Ensure required NOT NULL fields are populated on existing pending orders
      const { error: updErr } = await supabase
        .from('orders')
        .update({ item_count: qty, items: snapshotItems, total: subtotal, fiat_amount_usd: subtotal })
        .eq('id', orderId);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    // Check listing availability vs this order
    const { data: lis } = await supabase
      .from('listings')
      .select('id, reserved_by_order, reserved_until, sold_by_order')
      .in('id', listingIds);
    const now = new Date();
    for (const r of lis || []) {
      if (r.sold_by_order) {
        return NextResponse.json({ error: 'items_unavailable' }, { status: 409 });
      }
      if (r.reserved_by_order && r.reserved_by_order !== orderId && r.reserved_until && new Date(r.reserved_until) > now) {
        return NextResponse.json({ error: 'items_unavailable' }, { status: 409 });
      }
    }

    // Reserve if not already reserved by this order
    const needReserve = (lis || []).some(r => !r.reserved_by_order || !r.reserved_until || new Date(r.reserved_until) <= now);
    if (needReserve) {
      const HOLD_MINUTES = Number.parseInt(process.env.RESERVE_HOLD_MINUTES || '10', 10);
      const { error: reserveErr } = await supabase.rpc('reserve_listings', {
        p_order: orderId,
        p_listing_ids: listingIds,
        p_hold_minutes: HOLD_MINUTES,
      });
      if (reserveErr) {
        return NextResponse.json({ error: 'items_unavailable' }, { status: 409 });
      }
    }

    return NextResponse.json({ ok: true, order_id: orderId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
