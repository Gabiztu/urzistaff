import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { buildPersonalizedGuide } from '@/lib/pdf/guide';
import { sendGuideEmail } from '@/lib/email/brevo';

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
    const paidStatuses = new Set(['finished','confirmed','complete','completed','paid']);
    const extendStatuses = new Set(['confirming','partially_paid','waiting']);
    const failStatuses = new Set(['failed','expired','refunded','chargeback','canceled','cancelled']);
    const isPaid = paidStatuses.has(paymentStatus);

    // Update order record and apply listing state transitions
    if (orderId) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Load listing ids from order snapshot
      const { data: orderRow } = await supabase
        .from('orders')
        .select('id, items')
        .eq('id', orderId)
        .maybeSingle();
      const listingIds = Array.isArray(orderRow?.items) ? orderRow.items.map((x) => x.listing_id).filter(Boolean) : [];

      const update = {
        ipn_status: paymentStatus || null,
        ipn_payload: payload || null,
      };
      if (isPaid) {
        update.status = 'paid';
        update.paid_at = new Date().toISOString();
      } else if (failStatuses.has(paymentStatus)) {
        update.status = 'failed';
      }
      await supabase
        .from('orders')
        .update(update)
        .eq('id', orderId);

      // Extend hold if tx is in-flight
      if (listingIds.length && extendStatuses.has(paymentStatus)) {
        const EXTEND_MIN = Number.parseInt(process.env.RESERVE_EXTEND_MINUTES || '20', 10);
        await supabase.rpc('extend_hold', {
          p_order: orderId,
          p_listing_ids: listingIds,
          p_extend_minutes: EXTEND_MIN,
        });
      }

      // On paid: mark as sold and make permanently unavailable
      if (listingIds.length && isPaid) {
        await supabase
          .from('listings')
          .update({
            sold_by_order: orderId,
            sold_at: new Date().toISOString(),
            reserved_by_order: null,
            reserved_until: null,
            is_active: false,
          })
          .in('id', listingIds)
          .is('sold_by_order', null);
      }

      // On failure: release holds
      if (failStatuses.has(paymentStatus)) {
        await supabase
          .from('listings')
          .update({ reserved_by_order: null, reserved_until: null })
          .eq('reserved_by_order', orderId)
          .is('sold_by_order', null);
      }

      // Send personalized guide email exactly once when paid
      if (isPaid) {
        // Atomically claim send by setting sent_at if null
        const { data: claim } = await supabase
          .from('orders')
          .update({ guide_email_sent_at: new Date().toISOString() })
          .eq('id', orderId)
          .is('guide_email_sent_at', null)
          .select('id, email, full_name, items')
          .maybeSingle();

        if (claim && claim.email) {
          try {
            const pdf = await buildPersonalizedGuide({ fullName: claim.full_name, orderId, items: claim.items });
            const base64 = Buffer.from(pdf).toString('base64');
            const subject = 'Your UrziStaff Welcome Guide';
            const html = `<p>Hi ${claim.full_name || ''},</p><p>Thanks for your order. Your personalized guide is attached.</p>`;
            const { messageId } = await sendGuideEmail({
              toEmail: claim.email,
              toName: claim.full_name || undefined,
              subject,
              html,
              attachments: [{ name: 'UrziStaff-Guide.pdf', content: base64, contentType: 'application/pdf' }],
            });
            await supabase
              .from('orders')
              .update({ guide_email_message_id: messageId || null, guide_email_error: null })
              .eq('id', orderId);
          } catch (err) {
            // Revert sent flag to allow retry on next IPN
            await supabase
              .from('orders')
              .update({ guide_email_sent_at: null, guide_email_error: String(err?.message || err) })
              .eq('id', orderId)
              .is('guide_email_message_id', null);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}
