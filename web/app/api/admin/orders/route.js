import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const h = headers();
    const reqEmail = (h.get('x-admin-email') || '').toLowerCase();
    if (adminEmail && reqEmail !== adminEmail) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const statusParam = (url.searchParams.get('status') || '').trim();
    const onlyPaidFailed = url.searchParams.has('onlyPaidFailed');

    let query = supabase
      .from('orders')
      .select('id, created_at, paid_at, status, ipn_status, full_name, telegram, address, city, country, region, zip, items')
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusParam) {
      const statuses = statusParam
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
      if (statuses.length) {
        query = query.in('status', statuses);
      }
    } else if (onlyPaidFailed) {
      // Show only successful purchases OR attempts that failed/expired/canceled
      const failureStatuses = ['failed','expired','refunded','chargeback','rejected','cancelled','canceled'];
      // We'll fetch a superset and filter client-side in case .or() is limited; but try server first
      query = query.or(
        `status.eq.paid,ipn_status.in.(${failureStatuses.join(',')})`
      );
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ orders: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
