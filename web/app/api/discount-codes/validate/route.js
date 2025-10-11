import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const raw = (url.searchParams.get('code') || '').trim();
    const code = raw.toUpperCase();
    if (!code) return NextResponse.json({ valid: false });

    const { data, error } = await supabase
      .from('discount_codes')
      .select('code, discount_pct')
      .eq('code', code)
      .maybeSingle();
    if (error) return NextResponse.json({ valid: false, error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ valid: false });
    return NextResponse.json({ valid: true, code: data.code, pct: Number(data.discount_pct || 0.10) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ valid: false, error: e.message || String(e) }, { status: 500 });
  }
}
