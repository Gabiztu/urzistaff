import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(rawBody, 'utf8');
  const digest = hmac.digest('hex');
  return digest.toLowerCase() === signature.toLowerCase();
}

export async function POST(req) {
  try {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    const sig = req.headers.get('x-nowpayments-sig');
    const raw = await req.text();
    const ok = verifySignature(raw, sig, secret || '');
    if (!ok) return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });

    // Parse and persist order/payment status
    let payload = {};
    try { payload = JSON.parse(raw); } catch {}

    const orderId = payload?.order_id || payload?.orderId || null;
    const paymentStatus = String(payload?.payment_status || payload?.status || '').toLowerCase();
    const isPaid = ['finished','confirmed','complete','completed','paid'].includes(paymentStatus);

    // Update order record if possible
    if (orderId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      const update = {
        ipn_status: paymentStatus || null,
        ipn_payload: payload || null,
      };
      if (isPaid) {
        update.status = 'paid';
        update.paid_at = new Date().toISOString();
      }
      await supabase
        .from('orders')
        .update(update)
        .eq('id', orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
