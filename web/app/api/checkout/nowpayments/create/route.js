import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CART_COOKIE = 'cart_token';
const UNIT_PRICE = 99; // USD per listing

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

export async function POST(request) {
  try {
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json({ error: 'NOWPayments API key not configured' }, { status: 500 });
    }

    const token = cookies().get(CART_COOKIE)?.value;
    const { data: cart } = await getCartByToken(token);
    if (!cart) return NextResponse.json({ error: 'cart_not_found' }, { status: 404 });

    const { data: items } = await getCartItems(cart.id);
    const qty = items.length;
    if (qty === 0) return NextResponse.json({ error: 'cart_empty' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const email = body?.email || undefined;
    const telegram = body?.telegram || undefined;
    const note = body?.note || undefined;
    const fullName = body?.fullName || undefined;
    const address = body?.address || undefined;
    const city = body?.city || undefined;
    const country = body?.country || undefined;
    const region = body?.region || undefined;
    const zip = body?.zip || undefined;

    const subtotal = UNIT_PRICE * qty;
    const total = subtotal; // no taxes/fees

    // Build absolute URLs
    const hdrs = headers();
    const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
    const proto = (hdrs.get('x-forwarded-proto') || 'https').split(',')[0];
    const base = `${proto}://${host}`;
    const successUrl = `${base}/checkout/success`;
    const cancelUrl = `${base}/checkout/cancel`;

    const orderDescription = `Urzistaff order for ${qty} listing(s)` +
      (fullName ? ` by ${fullName}` : '') +
      (telegram ? ` (tg: ${telegram})` : '') +
      (note ? ` | note: ${String(note).slice(0,140)}` : '');

    // Snapshot items to persist what was purchased
    const snapshotItems = (items || []).map(it => ({
      listing_id: it.listing_id,
      name: it.name ?? null,
      price: Number(it.price ?? UNIT_PRICE) || UNIT_PRICE,
    }));

    // Create order record (pending)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        cart_id: cart.id,
        full_name: fullName || null,
        telegram: telegram || null,
        note: note || null,
        address: address || null,
        city: city || null,
        country: country || null,
        region: region || null,
        zip: zip || null,
        item_count: qty,
        total,
        fiat_amount_usd: total,
        items: snapshotItems,
        status: 'pending',
      })
      .select('id')
      .single();
    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 400 });

    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      },
      body: JSON.stringify({
        price_amount: Number(total.toFixed(2)),
        price_currency: 'usd',
        order_id: String(order.id),
        order_description: orderDescription,
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(email ? { customer_email: email } : {}),
      }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || data?.error || 'NOWPayments error';
      return NextResponse.json({ error: msg, details: data }, { status: 400 });
    }

    // Expecting invoice_url in response
    const url = data?.invoice_url || data?.url || null;
    if (!url) return NextResponse.json({ error: 'missing_invoice_url', details: data }, { status: 502 });

    // Update order with invoice refs
    await supabase
      .from('orders')
      .update({ now_invoice_id: data?.id || data?.invoice_id || null, now_invoice_url: url })
      .eq('id', order.id);

    return NextResponse.json({ invoice_url: url, invoice_id: data?.id || data?.invoice_id, order_id: order.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
