import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function isAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const h = await headers();
  const reqEmail = (h.get('x-admin-email') || '').toLowerCase();
  return !adminEmail || (reqEmail && reqEmail === adminEmail);
}

export async function GET() {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const { data, error } = await supabase
      .from('discount_codes')
      .select('code, discount_pct, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ codes: data || [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    let code = String(body?.code || '').trim();
    if (!code) return NextResponse.json({ error: 'code_required' }, { status: 400 });
    code = code.toUpperCase();
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({ code, discount_pct: 0.10 })
      .select('code, discount_pct, created_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ code: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!(await isAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    const url = new URL(request.url);
    let code = url.searchParams.get('code') || '';
    if (!code) {
      const body = await request.json().catch(() => ({}));
      code = String(body?.code || '');
    }
    code = String(code).trim().toUpperCase();
    if (!code) return NextResponse.json({ error: 'code_required' }, { status: 400 });
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('code', code);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
