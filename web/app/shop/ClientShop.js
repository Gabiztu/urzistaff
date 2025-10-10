"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";

export default function ClientShop({ initialListings = [] }) {
  const router = useRouter();
  const catLogos = {
    reddit: "/reddit.png",
    instagram: "/instagram.png",
    x: "/x.png",
    facebook: "/facebook.png",
    tiktok: "/tiktok.png",
    threads: "/threads.png",
    "chat support": "/chat_support.png",
  };
  const [listings, setListings] = useState(initialListings);
  const [q, setQ] = useState("");
  const [typedQ, setTypedQ] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("Select");
  const [language, setLanguage] = useState("Select");
  const [devices, setDevices] = useState(new Set());
  const [maxRate, setMaxRate] = useState(10);
  const [selectedCats, setSelectedCats] = useState(new Set());
  const [cartCount, setCartCount] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && e.target.classList.add("in"));
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let alive = true; let timer;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer);
        timer = null;
      } else {
        load();
        timer = setInterval(load, 5000);
      }
    };
    const load = async () => {
      try {
        // Force fresh data so new listings appear immediately after admin creates them
        const res = await fetch('/api/listings?limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        setListings(Array.isArray(json?.data) ? json.data : []);
      } catch {}
    };
    load();
    timer = setInterval(load, 5000);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => { alive = false; if (timer) clearInterval(timer); document.removeEventListener('visibilitychange', handleVisibilityChange); };
  }, []);

  useEffect(() => {
    try {
      const n = parseInt(localStorage.getItem('cart_count') || '0', 10);
      if (Number.isFinite(n)) setCartCount(n);
    } catch {}
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        const json = await res.json();
        const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
        setCartCount(n);
        try { localStorage.setItem('cart_count', String(n)); } catch {}
      } catch {}
    };
    load();
  }, []);

  const toggleCategory = (cat) => {
    setSelectedCats(prev => { const next = new Set(prev); if (next.has(cat)) next.delete(cat); else next.add(cat); return next; });
  };

  const toggleDevice = (dev) => {
    setDevices(prev => { const next = new Set(prev); if (next.has(dev)) next.delete(dev); else next.add(dev); return next; });
  };

  const toggleAge = (v) => setAge(p => p === v ? "" : v);
  const toggleSex = (v) => setSex(p => p === v ? "" : v);
  const toggleAvailability = (v) => setAvailability(p => p === v ? "" : v);
  const toggleLanguage = (v) => setLanguage(p => p === v ? "Select" : v);

  const availableLanguages = useMemo(() => {
    const s = new Set();
    (listings || []).forEach(r => {
      (r.languages || []).forEach(l => s.add(l));
    });
    return Array.from(s).sort();
  }, [listings]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return listings.filter((r) => {
      if (query) {
        const hay = `${r.name||''} ${r.headline||''} ${(r.categories||[]).join(' ')} ${(r.languages||[]).join(' ')} ${r.location||''} ${r.description||''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (selectedCats.size) {
        const cat = (r.categories && r.categories[0] || '').toLowerCase();
        if (!selectedCats.has(cat)) return false;
      }
      if (age && (r.age_range || '') !== age) return false;
      if (sex && (r.sex || '') !== sex) return false;
      if (availability && (r.availability || '') !== availability) return false;
      if (language && language !== 'Select' && !(r.languages||[]).includes(language)) return false;
      if (location && location !== 'Select' && (r.location || '') !== location) return false;
      if (devices.size) {
        const devs = new Set((r.devices||[]).map((d)=>String(d).toLowerCase()));
        let ok = false; for (const d of devices) { if (devs.has(d)) { ok = true; break; } }
        if (!ok) return false;
      }
      const rate = Number(r.hourly_rate ?? 0);
      if (Number.isFinite(maxRate) && rate > maxRate) return false;
      return true;
    });
  }, [listings, q, selectedCats, age, sex, availability, location, language, devices, maxRate]);

  const addToCart = useCallback(async (item) => {
    try {
      await fetch('/api/cart', { method: 'POST' });
      await fetch('/api/cart/items', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ listing_id:item.id, name:item.name, headline:item.headline||'' }) });
      const res = await fetch('/api/cart', { cache: 'no-store' });
      const json = await res.json();
      const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
      setCartCount(n);
      try { localStorage.setItem('cart_count', String(n)); } catch {}
    } catch {}
  }, []);

  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    let dots = [];
    const setup = () => {
      const parent = canvas.parentElement; canvas.width = parent ? parent.offsetWidth : window.innerWidth; canvas.height = parent ? parent.offsetHeight : 300; dots = [];
      for (let i = 0; i < (canvas.width / 18); i++) { dots.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: -0.5+Math.random(), vy: -0.5+Math.random(), radius: Math.random()*1.5 }); }
    };
    const tick = () => { if (!ctx) return; ctx.clearRect(0,0,canvas.width,canvas.height); dots.forEach((d) => { d.x += d.vx; d.y += d.vy; if (d.x < 0 || d.x > canvas.width) d.vx = -d.vx; if (d.y < 0 || d.y > canvas.height) d.vy = -d.vy; ctx.beginPath(); ctx.arc(d.x,d.y,d.radius,0,Math.PI*2); ctx.fillStyle = 'rgba(127, 90, 240, 0.6)'; ctx.fill(); }); for (let i=0;i<dots.length;i++) { for (let j=i+1;j<dots.length;j++) { const dist = Math.hypot(dots[i].x-dots[j].x, dots[i].y-dots[j].y); if (dist < 120) { ctx.strokeStyle = `rgba(127, 90, 240, ${0.8 - dist/120})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke(); } } } raf = requestAnimationFrame(tick); };
    let raf; setup(); tick(); const onResize = () => setup(); window.addEventListener('resize', onResize);
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container nav-container">
          <a href="/" className="nav-brand" aria-label="UrziStaff home">
            <span className="nav-brand-text">UrziStaff</span>
          </a>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/shop" className="active">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support">Support</a>
          </nav>
          <button
            type="button"
            className="menu-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={()=>setMenuOpen(v=>!v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
          <a href="/cart" className="btn-cart" aria-label="Cart">
            <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25"/></svg>
            <span id="cartCount" style={{visibility: cartCount===null ? 'hidden' : 'visible'}}>{cartCount ?? ''}</span>
          </a>
        </div>
        <nav className={`mobile-nav${menuOpen ? ' open' : ''}`}>
          <a href="/">Home</a>
          <a href="/shop" className="active">Shop</a>
          <a href="/faq">FAQ</a>
          <a href="/support">Support</a>
        </nav>
      </header>
      <header className="browse-hero">
        <canvas id="constellation" ref={canvasRef} aria-hidden="true"></canvas>
        <div className="browse-hero-content reveal">
          <h1>Find your <span className="gradient-text">dedicated employee</span> to grow your business.</h1>
          <p>We connect you with elite, pre-vetted virtual assistants who seamlessly integrate into your workflow.</p>
          <form
            className="search-bar"
            role="search"
            onSubmit={(e)=>{ e.preventDefault(); setQ(typedQ.trim()); }}
          >
            <div className="search-input-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/></svg>
              <input
                id="q"
                name="q"
                className="input"
                type="text"
                placeholder="Search assistants by role, skills, location..."
                value={typedQ}
                onChange={(e)=>setTypedQ(e.target.value)}
              />
              {typedQ && (
                <button
                  type="button"
                  id="clearSearch"
                  className="clear-btn"
                  aria-label="Clear search"
                  onClick={()=>{ setTypedQ(""); setQ(""); }}
                  style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', width:36, height:36, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'50%' }}
                >
                  ✕
                </button>
              )}
            </div>
            <button className="btn-primary" type="submit">Search</button>
          </form>
        </div>
      </header>
      <section className="categories-section reveal">
        <div className="container">
          <h2>Popular categories</h2>
          <div className="category-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              {k:'reddit', label:'👽 Reddit'},
              {k:'instagram', label:'📸 Instagram'},
              {k:'x', label:'𝕏 X (Twitter)'},
              {k:'facebook', label:'📘 Facebook'},
              {k:'chat support', label:'💬 Chat Support'},
              {k:'tiktok', label:'🎵 Tiktok'},
              {k:'threads', label:'🧵 Threads'},
            ].map(c => (
              <a
                key={c.k}
                href="#"
                className={`category-card${selectedCats.has(c.k)?' active':''}`}
                data-category={c.k}
                onClick={(e)=>{e.preventDefault(); toggleCategory(c.k);}}
              >
                {catLogos[c.k]
                  ? (
                    <img
                      src={catLogos[c.k]}
                      alt={c.label.slice(c.label.indexOf(' ')+1)}
                      className="category-logo"
                      style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0, borderRadius: '50%' }}
                    />
                  )
                  : (
                    <span>{c.label.split(' ')[0]}</span>
                  )}
                {" "}
                {c.label.slice(c.label.indexOf(' ')+1)}
              </a>
            ))}
          </div>
        </div>
      </section>
      <main className="main-listings-area" id="content">
        <div className="container">
          <div className="filters-bar reveal">
            <fieldset className="filter-group">
              <legend>Age</legend>
              <div className="filter-options">
                {['18-20','20-25','25-30','30+'].map(v => (
                  <label
                    key={v}
                    className="chip"
                    onClick={(e)=>{ if (age===v) { e.preventDefault(); setAge(""); } }}
                  >
                    <input type="radio" name="age" value={v} checked={age===v} onChange={()=>setAge(v)} />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Sex</legend>
              <div className="filter-options">
                {['male','female'].map(v => (
                  <label
                    key={v}
                    className="chip"
                    onClick={(e)=>{ if (sex===v) { e.preventDefault(); setSex(""); } }}
                  >
                    <input type="radio" name="sex" value={v} checked={sex===v} onChange={()=>setSex(v)} />
                    <span>{v[0].toUpperCase()+v.slice(1)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Device</legend>
              <div className="filter-options">
                {['windows','macos'].map(v => (
                  <label key={v} className="chip">
                    <input type="checkbox" name="device" value={v} checked={devices.has(v)} onChange={()=>toggleDevice(v)} />
                    <span>{v === 'macos' ? 'MacOS' : 'Windows'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Availability</legend>
              <div className="filter-options">
                {['full-time','part-time'].map(v => (
                  <label
                    key={v}
                    className="chip"
                    onClick={(e)=>{ if (availability===v) { e.preventDefault(); setAvailability(""); } }}
                  >
                    <input type="radio" name="availability" value={v} checked={availability===v} onChange={()=>setAvailability(v)} />
                    <span>{v === 'full-time' ? 'Full Time' : 'Part Time'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="filters-break" aria-hidden="true" />
            <div className="filter-group">
              <div className="label">Location</div>
              <select className="filter-select" name="location" aria-label="Location" value={location} onChange={(e)=>setLocation(e.target.value)}>
                {[
                  'Select',
                  'United States','United Kingdom','Canada','Australia','New Zealand','Ireland',
                  'Germany','France','Italy','Spain','Portugal','Netherlands','Belgium','Switzerland','Austria',
                  'Sweden','Norway','Denmark','Finland','Poland','Czechia','Romania','Greece','Hungary','Bulgaria','Croatia','Serbia','Turkey','Ukraine','Russia',
                  'Brazil','Mexico','Argentina','Chile','Colombia','Peru',
                  'Philippines','India','Indonesia','Malaysia','Singapore','Thailand','Vietnam','Japan','South Korea','China',
                  'South Africa','Nigeria','Kenya','Egypt','United Arab Emirates'
                ].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <div className="label">Language</div>
              <select className="filter-select" name="language" aria-label="Language" value={language} onChange={(e)=>setLanguage(e.target.value)}>
                {['Select', ...availableLanguages].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="filter-group rate">
              <div className="label">Hourly Rate</div>
              <input type="range" min="1" max="10" step="1" id="rateRange" aria-label="Hourly Rate" value={maxRate} onChange={(e)=>setMaxRate(Number(e.target.value))} />
              <div id="rateValue">${""+maxRate}/hr</div>
            </div>
          </div>
          <div className="listings-container reveal">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="listing-card"
                data-category={(r.categories&&r.categories[0])||''}
                data-age={r.age_range||''}
                data-sex={r.sex||''}
                data-device={(r.devices||[]).join(',')}
                data-availability={r.availability||''}
                data-location={r.location||''}
                data-language={(r.languages&&r.languages[0])||''}
                data-rate={r.hourly_rate ?? ''}
                style={{position:'relative', cursor:'pointer'}}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/p/${r.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/p/${r.id}`); } }}
              >
                <img loading="lazy" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name||'VA')}`} alt={r.name} className="avatar" />
                <div className="listing-info">
                  <div className="name">
                    {r.name}
                    <img src="/verified.svg" alt="Verified" style={{ height: '1em', width: '1em', marginLeft: 6, verticalAlign: '-0.15em' }} />
                    {r.availability ? (
                      <span style={{ marginLeft: 8, fontSize: 12, color: '#60a5fa', opacity: 0.9, fontWeight: 600 }}>
                        {r.availability === 'full-time' ? 'Full-time' : (r.availability === 'part-time' ? 'Part-time' : r.availability)}
                      </span>
                    ) : null}
                  </div>
                  <div className="per-hour" style={{color:'var(--muted)', fontSize:14, marginTop:4}}>
                    ${Number(r.hourly_rate ?? 0).toFixed(0)} per hour
                  </div>
                  <div className="skills" style={{marginTop:6}}>
                    {(r.categories||[]).map((c) => (<span key={`cat-${c}`} className="skill">{c}</span>))}
                    {(r.languages||[]).map((l) => (<span key={`lang-${l}`} className="skill">{l}</span>))}
                    {(r.devices||[]).map((d) => (<span key={`dev-${d}`} className="skill">{d}</span>))}
                  </div>
                </div>
                <div className="listing-meta">
                  <div className="price">${Number(r.purchase_price ?? 99).toFixed(0)}</div>
                  <button className="btn-primary" type="button" style={{position:'relative', zIndex:6}} onClick={(e)=>{e.preventDefault(); e.stopPropagation(); addToCart(r);}}>Add to Cart</button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="card">No listings found.</div>
            )}
          </div>
        </div>
      </main>
      <ThemeToggle />
    </>
  );
}
