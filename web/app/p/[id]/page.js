"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ListingProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const n = parseInt(window.localStorage?.getItem('cart_count') || '0', 10);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  });

  useEffect(() => {
    const load = async () => {
      console.debug("[ListingProfile] loading id:", id);
      try {
        // First try our API route (server uses service role)
        const res = await fetch(`/api/listings?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        console.debug("[ListingProfile] /api/listings response:", res.status, json);
        if (res.ok && (json?.data?.length || json?.data)) {
          const row = Array.isArray(json.data) ? json.data[0] : json.data;
          setData(row);
          return;
        }
        // Fallback: query Supabase directly from the client
        const { data: direct, error: directErr } = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        console.debug("[ListingProfile] direct supabase fallback:", { direct, directErr });
        if (directErr) throw directErr;
        if (!direct) throw new Error("Not found");
        setData(direct);
      } catch (e) {
        console.error("[ListingProfile] load error:", e);
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      // Ensure cart exists (creates guest cart if needed)
      await fetch('/api/cart', { method: 'POST' });
      const price = 99; // fixed price per requirement
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: data.id, name: data.name, headline: data.headline || '', price })
      });
      // Refresh count from API
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        const json = await res.json();
        const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
        setCartCount(n);
        try { window.localStorage?.setItem('cart_count', String(n)); } catch {}
      } catch {}
    } catch (e) {
      // swallow
    }
  };

  const availableNow = data?.is_active;

  if (loading) return <main style={{padding:24}}><p>Loading...</p></main>;
  if (error || !data) return (
    <main style={{padding:24}}>
      <p style={{color:'#f88'}}>Failed to load: {error || 'Not found'}</p>
      <div style={{marginTop:8}}>
        <button onClick={()=>location.reload()} style={{padding:'8px 12px', border:'1px solid #2b2a33', borderRadius:8, background:'#0f0f14', color:'#e5e7eb'}}>Reload</button>
      </div>
      <pre style={{marginTop:12, background:'#0b0a10', padding:12, borderRadius:8, border:'1px solid #2b2a33', color:'#94a3b8'}}>
        id: {String(id)}
      </pre>
    </main>
  );

  return (
    <>
      <style suppressHydrationWarning>{`
    html{scroll-behavior:smooth; scrollbar-gutter: stable both-edges}
    :root { --primary:#7F5AF0; --accent-1:#00C6CF; --accent-2:#F04E8A; --bg:#0B0A10; --surface:#14131B; --elev:#1C1B22; --text:#E5E7EB; --muted:#94A3B8; --border:#2B2A33; --success:#10B981; --radius:14px; --pill:999px; --shadow:0 8px 40px rgba(0,0,0,0.4); --ease-out:cubic-bezier(.22,1,.36,1); }
    *,*::before,*::after{box-sizing:border-box}
    body{margin:0;font-family:Inter, sans-serif;background:var(--bg);color:var(--text)}
    .container{max-width:1100px;margin:0 auto;padding:0 16px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--pill);padding:12px 24px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text);transition:all .2s var(--ease-out)}
    .btn:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:#444}
    .btn-primary{background:var(--primary);border-color:var(--primary);color:#fff}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
    .site-header{position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.5) blur(12px);background:color-mix(in oklab, var(--bg) 80%, transparent);border-bottom:1px solid var(--border);padding:12px 0}
    .nav-container{display:flex;align-items:center;justify-content:space-between}
    .nav-brand{display:flex;align-items:center;gap:10px;font-family:"Space Grotesk",sans-serif;font-weight:600;color:inherit;text-decoration:none}
    .nav-brand-logo{width:32px;height:32px;background:var(--primary);border-radius:8px}
    .nav-links{display:none}
    .nav-actions{display:flex;align-items:center;gap:8px}
    .nav-actions .btn{padding:8px 16px}
    @media(min-width:768px){.nav-links{display:flex;gap:32px;font-weight:500;color:var(--muted);position:absolute;left:50%;transform:translateX(-50%)}}
    .nav-links a{color:inherit;text-decoration:none;transition:color .2s var(--ease-out)}.nav-links a:hover{color:var(--text)}
    .cart-icon{width:24px;height:24px}
    .profile-header{padding:64px 0;text-align:center}
    .profile-header .avatar{width:128px;height:128px;border-radius:50%;object-fit:cover;margin:0 auto 16px;border:4px solid var(--surface);box-shadow:0 0 0 4px var(--primary), var(--shadow)}
    .profile-header .name{font-family:"Space Grotesk",sans-serif;font-size:clamp(2rem,5vw,2.75rem);margin:0}
    .profile-header .headline{font-size:18px;color:var(--muted);margin:4px 0 16px}
    .meta-tags{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-bottom:24px}
    .meta-tag{background:var(--surface);border:1px solid var(--border);padding:8px 16px;border-radius:var(--pill);font-size:14px;display:inline-flex;align-items:center;gap:8px}
    .status-dot{width:8px;height:8px;background:var(--success);border-radius:50%}
    .header-actions{display:flex;justify-content:center;gap:12px}
    .profile-grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:flex-start;padding-bottom:80px}
    @media(min-width:900px){.profile-grid{grid-template-columns:2fr 1fr}}
    .profile-main-content{display:grid;gap:24px}
    .profile-sidebar.sticky{position:sticky;top:88px}
    .section-title{font-family:"Space Grotesk",sans-serif;font-size:22px;margin:0 0 16px}
    .about-section p{color:var(--muted);line-height:1.7;margin:0 0 10px}
    .review-card{background:var(--elev);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:16px}
    .review-header{display:flex;align-items:center;gap:12px;margin-bottom:8px}
    .review-header .avatar{width:32px;height:32px;border-radius:50%;object-fit:cover}
    .review-header .name{font-weight:600}
    .review-header .rating{margin-left:auto;color:#F59E0B;font-weight:600}
    .review-body{color:var(--muted);font-size:14px}
    .sidebar-card ul{list-style:none;padding:0;margin:0}
    .sidebar-card li{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)}
    .sidebar-card li:last-child{border-bottom:0}
    .sidebar-card .label{color:var(--muted)}
    .sidebar-card .value{font-weight:600}
    .sidebar-card .btn{width:100%;margin-top:16px}
      `}</style>

      <header className="site-header">
        <div className="container nav-container">
          <a href="/" className="nav-brand">
            <div className="nav-brand-logo"></div>
            <span>Urzistaff</span>
          </a>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support">Support</a>
          </nav>
          <div className="nav-actions">
            <a className="btn" href="/shop">← Back to Shop</a>
            <a className="btn btn-cart" aria-label="Cart" href="/cart">
              <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25" />
              </svg>
              <span>{cartCount}</span>
            </a>
          </div>
        </div>
      </header>

      <main id="content">
        <div className="container">
          <header className="profile-header">
            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name||'VA')}`} alt={data.name} className="avatar" />
            <h1 className="name">{data.name}</h1>
            {data.headline && <p className="headline">{data.headline}</p>}
            <div className="meta-tags">
              <div className="meta-tag"><span className="status-dot" style={{background: availableNow ? 'var(--success)' : '#ef4444'}}></span> {availableNow ? 'Available Now' : 'Unavailable'}</div>
              {data.location && <div className="meta-tag">{data.location}</div>}
              {(data.categories?.length>0) && <div className="meta-tag">{data.categories[0]}</div>}
            </div>
            <div className="header-actions"><button className="btn btn-primary" onClick={handleAddToCart}>Add to Cart {typeof data.hourly_rate==='number' ? `for $${Number(data.hourly_rate).toFixed(0)}/hr` : ''}</button></div>
          </header>

          <div className="profile-grid">
            <div className="profile-main-content">
              <section className="card about-section">
                <h2 className="section-title">About Me</h2>
                <p>{data.description || '—'}</p>
              </section>

              <section className="card reviews-section">
                <h2 className="section-title">Client Reviews {data.reviews_count ? `(${data.reviews_count})` : ''}</h2>
                {data.rating ? (
                  <div className="review-card">
                    <div className="review-header">
                      <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((data.name||'').slice(0,2)+' Client')}`} alt="Client" className="avatar" />
                      <span className="name">Recent Feedback</span>
                      <span className="rating">⭐ {Number(data.rating).toFixed(1)}</span>
                    </div>
                    <p className="review-body">This assistant maintains an excellent average rating. Detailed public excerpts are not available yet.</p>
                  </div>
                ) : (
                  <div className="review-card"><p className="review-body">No public reviews yet.</p></div>
                )}
              </section>
            </div>

            <aside className="profile-sidebar sticky">
              <div className="card sidebar-card">
                <h2 className="section-title">Key Details</h2>
                <ul>
                  <li><span className="label">Hourly Rate</span><span className="value">{typeof data.hourly_rate === 'number' ? `$${data.hourly_rate}/hr` : '✓'}</span></li>
                  <li><span className="label">Languages</span><span className="value">{data.languages?.join(', ') || '✓'}</span></li>
                  <li><span className="label">Location</span><span className="value">{data.location || '✓'}</span></li>
                  <li><span className="label">Availability</span><span className="value">{availableNow ? 'Available' : 'Unavailable'}</span></li>
                </ul>
                <h2 className="section-title" style={{marginTop:24}}>Setup</h2>
                <ul>
                  {(data.devices||[]).map((d) => (
                    <li key={d}><span className="label">{d}</span><span className="value">✓</span></li>
                  ))}
                  {(!data.devices || data.devices.length===0) && <li><span className="label">Devices</span><span className="value">✓</span></li>}
                </ul>
                <button className="btn btn-primary" onClick={handleAddToCart}>Add to Cart</button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}