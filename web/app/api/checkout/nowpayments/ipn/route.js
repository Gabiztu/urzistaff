import { NextResponse } from 'next/server';
import crypto from 'crypto';

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

    // You can parse and persist order/payment status here if needed.
    // const payload = JSON.parse(raw);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
