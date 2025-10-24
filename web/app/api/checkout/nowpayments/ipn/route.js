import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendGuideEmail } from '@/lib/email/brevo';

function verifySignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const normalized = String(signature).trim().toLowerCase().replace(/^sha512=/, '');
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(rawBody, 'utf8');
  const digest = hmac.digest('hex');
  return digest.toLowerCase() === normalized;
}

function parsePayloadFlexible(raw, contentType) {
  let payload = {};
  if (!raw) return payload;
  const ct = String(contentType || '').toLowerCase();
  // Try JSON first if content-type says json or body looks like JSON
  if (ct.includes('application/json') || raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  // Try URL-encoded (NOWPayments may send form)
  if (ct.includes('application/x-www-form-urlencoded') || (raw.includes('=') && !raw.trim().startsWith('{'))) {
    try {
      const params = new URLSearchParams(raw);
      params.forEach((v, k) => { payload[k] = v; });
      return payload;
    } catch { /* fall through */ }
  }
  // Fallback: very permissive parser for bodies like {order_id:xxx,payment_status:paid}
  try {
    const inner = raw.trim().replace(/^\{/, '').replace(/\}$/, '');
    if (inner.includes(':')) {
      const obj = {};
      inner.split(',').forEach((pair) => {
        const idx = pair.indexOf(':');
        if (idx > -1) {
          const k = pair.slice(0, idx).trim().replace(/^"|"$/g, '');
          const v = pair.slice(idx + 1).trim().replace(/^"|"$/g, '');
          obj[k] = v;
        }
      });
      return obj;
    }
  } catch { /* ignore */ }
  return payload;
}

export async function POST(req) {
  try {
    const secret = process.env.NOWPAYMENTS_IPN_SECRET;
    const sig = req.headers.get('x-nowpayments-sig');
    const raw = await req.text();
    const ok = verifySignature(raw, sig, secret || '');
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 });
    }

    // Parse and persist order/payment status
    const contentType = req.headers.get('content-type') || '';
    const payload = parsePayloadFlexible(raw, contentType);

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
      const { data: orderRow, error: orderFetchErr } = await supabase
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
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update(update)
        .eq('id', orderId);

      // Extend hold if tx is in-flight
      let extendErr = null;
      if (listingIds.length && extendStatuses.has(paymentStatus)) {
        const EXTEND_MIN = Number.parseInt(process.env.RESERVE_EXTEND_MINUTES || '20', 10);
        const { error } = await supabase.rpc('extend_hold', {
          p_order: orderId,
          p_listing_ids: listingIds,
          p_extend_minutes: EXTEND_MIN,
        });
        extendErr = error || null;
      }

      // On paid: mark as sold and make permanently unavailable
      let soldErr = null;
      if (listingIds.length && isPaid) {
        const { error } = await supabase
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
        soldErr = error || null;
      }

      // On failure: release holds
      let releaseErr = null;
      if (failStatuses.has(paymentStatus)) {
        const { error } = await supabase
          .from('listings')
          .update({ reserved_by_order: null, reserved_until: null })
          .eq('reserved_by_order', orderId)
          .is('sold_by_order', null);
        releaseErr = error || null;
      }

      // Send personalized guide email exactly once when paid
      if (isPaid) {
        // Atomically claim send by setting sent_at if null
        const { data: claim, error: claimErr } = await supabase
          .from('orders')
          .update({ guide_email_sent_at: new Date().toISOString() })
          .eq('id', orderId)
          .is('guide_email_sent_at', null)
          .select('id, email, full_name, items')
          .maybeSingle();

        if (claim && claim.email) {
          try {
            const itemsArr = Array.isArray(claim.items) ? claim.items : [];
            const firstItem = itemsArr[0] || null;
            const clientName = (claim.full_name || (claim.email?.split('@')[0] || '')).trim() || 'there';
            // Load VA contacts for ALL purchased listings
            const orderedIds = (Array.isArray(itemsArr) ? itemsArr.map(i => i?.listing_id).filter(Boolean) : []).slice(0, 20);
            let details = [];
            if (orderedIds.length) {
              const { data: listingsAll } = await supabase
                .from('listings')
                .select('id, name, va_email, va_telegram, va_whatsapp')
                .in('id', orderedIds);
              const byId = Object.create(null);
              for (const l of (listingsAll || [])) byId[l.id] = l;
              details = orderedIds.map((id) => byId[id] || { id, name: '—', va_email: '—', va_telegram: '—', va_whatsapp: '—' });
            }

            const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
            const fmtHandle = (h) => {
              const raw = String(h || '').trim();
              if (!raw) return '—';
              const handle = raw.replace(/^@+/, '');
              const url = `https://t.me/${encodeURIComponent(handle)}`;
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">@${esc(handle)}</a>`;
            };
            const fmtWa = (w) => {
              const raw = String(w || '').trim();
              if (!raw) return '—';
              const digits = raw.replace(/[^0-9+]/g, '');
              const link = digits.replace(/^\+/, '');
              const url = `https://wa.me/${encodeURIComponent(link)}`;
              return `<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(raw)}</a>`;
            };

            // Build a fixed-layout table; when more than 6 VAs, wrap into multiple row blocks (6 columns per row)
            const contactTable = details.length ? `
              <div>
                <p>🔗 <strong>Contact Info</strong></p>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed">
                  ${(() => {
                    const COLS_PER_ROW = 6;
                    const chunks = [];
                    for (let i = 0; i < details.length; i += COLS_PER_ROW) chunks.push(details.slice(i, i + COLS_PER_ROW));
                    return chunks.map(chunk => `
                      <tbody>
                        <tr>
                          ${chunk.map(d => `<th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb">${esc(d.name || '—')}</th>`).join('')}
                        </tr>
                        <tr>
                          ${chunk.map(d => `<td style="padding:8px;vertical-align:top"><strong>Telegram:</strong> ${fmtHandle(d.va_telegram)}</td>`).join('')}
                        </tr>
                        <tr>
                          ${chunk.map(d => `<td style="padding:8px;vertical-align:top"><strong>Email:</strong> ${esc(d.va_email || '—')}</td>`).join('')}
                        </tr>
                        <tr>
                          ${chunk.map(d => `<td style="padding:8px;vertical-align:top"><strong>WhatsApp:</strong> ${fmtWa(d.va_whatsapp)}</td>`).join('')}
                        </tr>
                      </tbody>
                    `).join('');
                  })()}
                </table>
              </div>
            ` : '';

            const subject = 'Your UrziStaff order';
            const html = `
              <div>
                <p>Hey ${clientName},</p>
                <p>Your verified UrziStaff Virtual Assistant${details.length>1?'s are':' is'} officially assigned and ready to start.</p>
                ${contactTable}
                <p>🛡 <strong>Warranty Coverage</strong><br/>
                If the VA you bought:<br/>
                • ❌ Doesn’t respond within 72 hours, or<br/>
                • ❌ Becomes unavailable within the first 2 weeks after hiring,<br/>
                👉 You’ll be able to choose another VA of the same value — or multiple VAs that match the original value.<br/>
                We make sure you never lose time or money.</p>
                <p>📩 <strong>What’s Next?</strong></p>
                <ol>
                  <li>Reach out to your VA and introduce your workflow.</li>
                  <li>Share your main objectives or daily tasks.</li>
                  <li>If you ever need assistance or a replacement, just message <a href="https://t.me/raegency">@raegency</a> on Telegram.</li>
                </ol>
                <p>Welcome to the UrziStaff network — where elite Virtual Assistants power your agency’s growth.</p>
                <p>—<br/>UrziStaff Team<br/>Staffing Reinvented.<br/><a href="https://www.urzistaff.com">www.urzistaff.com</a></p>
              </div>
            `;
            const { messageId } = await sendGuideEmail({
              toEmail: claim.email,
              toName: claim.full_name || undefined,
              subject,
              html,
            });
            const { error: emailSaveErr } = await supabase
              .from('orders')
              .update({ guide_email_message_id: messageId || null, guide_email_error: null })
              .eq('id', orderId);
          } catch (err) {
            // Revert sent flag to allow retry on next IPN
            const { error: emailRevertErr } = await supabase
              .from('orders')
              .update({ guide_email_sent_at: null, guide_email_error: String(err?.message || err) })
              .eq('id', orderId)
              .is('guide_email_message_id', null);
          }
        }
        // no debug response in production
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

// Allow NowPayments link checkers (GET/HEAD) to return 200 so they don't treat the endpoint as down.
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
