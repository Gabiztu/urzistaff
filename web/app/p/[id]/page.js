"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ListingProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const n = parseInt(window.localStorage?.getItem('cart_count') || '0', 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      console.debug("[ListingProfile] loading id:", id);
      try {
        const res = await fetch(`/api/listings?id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        console.debug("[ListingProfile] /api/listings response:", res.status, json);
        if (res.ok && (json?.data?.length || json?.data)) {
          const row = Array.isArray(json.data) ? json.data[0] : json.data;
          setData(row);
          return;
        }
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
      await fetch('/api/cart', { method: 'POST' });
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: data.id, name: data.name, headline: data.headline || '' })
      });
      const res = await fetch('/api/cart', { cache: 'no-store' });
      const json = await res.json();
      const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
      setCartCount(n);
      try { window.localStorage?.setItem('cart_count', String(n)); } catch {}
    } catch (e) {
      console.error("Failed to add to cart:", e);
    }
  };

  const availableNow = data?.is_active;
  const displayRate = typeof data?.hourly_rate === 'number' ? data.hourly_rate : null;

  if (loading) return <main style={{padding:24}}><p>Loading profile...</p></main>;
  if (error || !data) return (
    <main style={{padding:24}}>
      <p style={{color:'#f88'}}>Failed to load profile: {error || 'Not found'}</p>
      <div style={{marginTop:8}}>
        <button onClick={()=>location.reload()} style={{padding:'8px 12px', border:'1px solid #2b2a33', borderRadius:8, background:'#0f0f14', color:'#e5e7eb'}}>Reload</button>
      </div>
    </main>
  );

  const formatAvailability = (availability) => {
    if (!availability) return 'Not specified';
    return availability.charAt(0).toUpperCase() + availability.slice(1).replace('-', ' ');
  };

  const formatValue = (value) => value || 'N/A';

  return (
    <>
      <style suppressHydrationWarning>{`
    *,*::before,*::after{box-sizing:border-box}
    .container{max-width:1200px;margin:0 auto;padding:0 24px}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--pill);padding:12px 24px;font-weight:600;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text);transition:transform .2s var(--ease-out), box-shadow .2s var(--ease-out), border-color .2s var(--ease-out); text-decoration: none;}
    .btn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(127,90,240,.25);border-color:#444}
    .btn-primary{background:var(--primary);border-color:var(--primary);color:#fff}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(1.5rem, 5vw, 2rem);transition:transform .2s var(--ease-out), box-shadow .2s var(--ease-out), border-color .2s var(--ease-out);}
    .card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:#444}
    .site-header{position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.5) blur(12px);background:color-mix(in oklab, var(--bg) 80%, transparent);border-bottom:1px solid var(--border);padding:12px 0}
    .nav-container{display:flex;align-items:center;justify-content:space-between;position:relative}
    .nav-brand{display:flex;align-items:center;gap:10px;font-family:"Space Grotesk",sans-serif;font-weight:600;color:inherit;text-decoration:none}
    .nav-brand-logo{width:32px;height:32px;background:var(--primary);border-radius:8px}
    .nav-actions{display:flex;align-items:center;gap:8px}
    /* Mobile menu */
    .menu-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 10px;margin-left:auto;margin-right:10px}
    @media (min-width: 768px) { .menu-btn { display: none; } }
    .mobile-nav{display:none;position:absolute;top:100%;left:12px;right:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;box-shadow:var(--shadow)}
    .mobile-nav a{display:block;padding:10px 12px;color:var(--text);border-radius:8px;text-align:center;text-decoration:none}
    .mobile-nav a:hover,.mobile-nav a.active{background:var(--elev)}
    .mobile-nav.open{display:flex;flex-direction:column;gap:6px}
    .nav-actions .btn{padding:8px 16px}
    .back-btn { gap: 8px; }
    .back-btn svg { width: 22px; height: 22px; }
    /* Small screens: icon-only circular back button */
    @media(max-width: 768px){
      .back-btn { width:40px; height:40px; padding:0; border-radius:50%; }
      .back-btn svg { width: 24px; height: 24px; }
      .back-btn .back-text{ display:none; }
    }
    .cart-icon{width:24px;height:24px}
    .profile-grid{display:grid;grid-template-columns:1fr;gap:32px;align-items:flex-start;padding: 48px 0 80px;}
    @media(min-width:900px){.profile-grid{grid-template-columns:minmax(0, 2fr) minmax(0, 1fr)}}
    .profile-main{display:flex; flex-direction:column; gap:32px;}
    .profile-sidebar.sticky{position:sticky;top:88px}
    .section-title{font-family:"Space Grotesk",sans-serif;font-size:24px;margin:0 0 16px;background:linear-gradient(120deg,var(--primary),var(--accent-1));-webkit-background-clip:text;background-clip:text;color:transparent}
    .profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
    .profile-header .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); flex-shrink: 0; }
    .profile-header .info .name { font-family: "Space Grotesk", sans-serif; font-size: clamp(2rem, 5vw, 2.75rem); margin: 0; line-height: 1.1; }
    .profile-header .info .headline { font-size: 18px; color: var(--muted); margin: 8px 0 0; }
    .tag-group { display: flex; flex-wrap: wrap; gap: 8px; margin-top:16px; padding:0; list-style:none; }
    .tag { background: var(--elev); border: 1px solid var(--border); padding: 6px 14px; border-radius: var(--pill); font-size: 14px; font-weight: 500; transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out), border-color .2s var(--ease-out);} 
    .tag:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.35); border-color: #444; }
    .description p { color: var(--muted); line-height: 1.7; margin: 0; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }
    .info-item .label { font-size: 14px; color: var(--muted); margin-bottom: 4px; display: block; }
    .info-item .value { font-weight: 600; font-size: 16px; }
    .sidebar-card { display:flex; flex-direction: column; gap:16px; align-items: stretch; text-align: center; }
    .sidebar-card .price { font-family:"Space Grotesk",sans-serif; font-size: 32px; margin: 0; text-align: left; align-self: flex-start; }
    .sidebar-card .price-note { color: var(--muted); font-size: 14px; margin-bottom: 16px; }
    .sidebar-card .btn { width: 100%; padding-top: 16px; padding-bottom: 16px; font-size: 18px; }
    .availability-badge { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; padding: 6px 12px; border-radius: var(--pill); }
    .availability-badge.available { background-color: #10B9811A; color: #10B981; }
    .availability-badge.unavailable { background-color: #ef44441A; color: #ef4444; }
    .availability-badge .dot { width: 8px; height: 8px; border-radius: 50%; }
    .availability-badge.available .dot { background-color: #10B981; animation: pulseDot 2.4s ease-in-out infinite; }
    .availability-badge.unavailable .dot { background-color: #ef4444; }
    @keyframes pulseDot { 0%,100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.35); opacity: 1 } }

    /* Simple reveal animation */
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
    .reveal { animation: fadeUp .5s var(--ease-out) both }

    /* Make sidebar card a bit narrower on desktop */
    @media (min-width: 900px) {
      .sidebar-card { max-width: 340px; margin-left: auto; }
    }
      `}</style>

      <header className="site-header">
        <div className="container nav-container">
          <a href="/" className="nav-brand">
            <span>UrziStaff</span>
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={()=>setMenuOpen(v=>!v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <div className="nav-actions">
            <a className="btn back-btn" href="/shop" aria-label="Back to listings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="back-text">Back to Listings</span>
            </a>
            <a className="btn btn-cart" aria-label="Cart" href="/cart">
              <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25" />
              </svg>
              <span id="cartCount" style={{visibility: cartCount===null ? 'hidden' : 'visible'}}>{cartCount ?? ''}</span>
            </a>
          </div>
        </div>
        <nav className={`mobile-nav${menuOpen ? ' open' : ''}`}>
          <a href="/">Home</a>
          <a href="/shop">Shop</a>
          <a href="/faq">FAQ</a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <main id="content">
        <div className="container">
          <div className="profile-grid">
            <div className="profile-main">
              <div className="profile-header reveal">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name||'VA')}`} alt={data.name} className="avatar" />
                <div className="info">
                  <h1 className="name">{data.name}</h1>
                  {data.headline && <p className="headline">{data.headline}</p>}
                </div>
              </div>
              
              <section className="card description reveal">
                <h2 className="section-title">Description</h2>
                <p>{data.description || 'No description provided.'}</p>
              </section>

              {data.categories && data.categories.length > 0 && (
                <section className="card reveal">
                  <h2 className="section-title">Categories</h2>
                  <ul className="tag-group">
                    {data.categories.map(cat => <li key={cat} className="tag">{cat}</li>)}
                  </ul>
                </section>
              )}

              <section className="card reveal">
                <h2 className="section-title">Details</h2>
                <div className="info-grid">
                  <div className="info-item"><span className="label">Age Range</span><span className="value">{formatValue(data.age_range)}</span></div>
                  <div className="info-item"><span className="label">Sex</span><span className="value">{formatValue(data.sex)}</span></div>
                  <div className="info-item"><span className="label">Availability</span><span className="value">{formatAvailability(data.availability)}</span></div>
                  <div className="info-item"><span className="label">Location</span><span className="value">{formatValue(data.location)}</span></div>
                </div>
              </section>

              <section className="card reveal">
                 <div style={{display:'flex', flexDirection:'column', gap: '24px'}}>
                    {data.languages && data.languages.length > 0 && (
                        <div>
                            <h3 style={{margin: '0 0 12px', fontSize: '16px'}}>Languages</h3>
                            <ul className="tag-group">
                                {data.languages.map(lang => <li key={lang} className="tag">{lang}</li>)}
                            </ul>
                        </div>
                    )}
                    {data.devices && data.devices.length > 0 && (
                        <div>
                            <h3 style={{margin: '0 0 12px', fontSize: '16px'}}>Devices</h3>
                            <ul className="tag-group">
                                {data.devices.map(dev => <li key={dev} className="tag">{dev}</li>)}
                            </ul>
                        </div>
                    )}
                 </div>
              </section>
            </div>

            <aside className="profile-sidebar sticky">
              <div className="card sidebar-card reveal">
                <div className="availability-badge">
                    {availableNow
                        ? <div className="availability-badge available"><span className="dot"></span>Available Now</div>
                        : <div className="availability-badge unavailable"><span className="dot"></span>Unavailable</div>
                    }
                </div>
                {displayRate != null && (
                  <div className="price">${displayRate}<span style={{fontSize: '16px', color: 'var(--muted)'}}>/hr</span></div>
                )}
                <button className="btn btn-primary" onClick={handleAddToCart} disabled={!availableNow}>
                  {availableNow ? 'Add to Cart' : 'Currently Unavailable'}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}