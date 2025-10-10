import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Prefer server-side service role (no RLS issues). Fallback to anon if not present.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '200');
    const id = searchParams.get('id');

    let query = supabase
      .from('listings')
      .select('id,name,headline,description,categories,languages,skills,age_range,sex,devices,availability,location,hourly_rate,purchase_price,rating,reviews_count,is_active,created_at');

    if (id) {
      // For a direct profile view, allow fetching by id regardless of is_active status
      query = query.eq('id', id).limit(1);
    } else {
      // Shop view shows only active listings
      query = query.eq('is_active', true).order('created_at', { ascending: false }).limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const cacheHeader = 'public, s-maxage=60, stale-while-revalidate=300';
    return NextResponse.json(
      { data },
      {
        headers: {
          'Cache-Control': cacheHeader,
          'CDN-Cache-Control': cacheHeader,
          'Vercel-CDN-Cache-Control': cacheHeader,
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}