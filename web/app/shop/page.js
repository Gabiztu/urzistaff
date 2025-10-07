"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import '../globals.css';

export default function ShopPage() {
  // UI state
  const [listings, setListings] = useState([]);
  const [q, setQ] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [availability, setAvailability] = useState("");
  const [location, setLocation] = useState("Select");
  const [language, setLanguage] = useState("");
  const [devices, setDevices] = useState(new Set());
  const [maxRate, setMaxRate] = useState(50);
  const [selectedCats, setSelectedCats] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);

  // Reveal on view
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.isIntersecting && e.target.classList.add("in"));
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Fetch listings + poll
  useEffect(() => {
    let alive = true; let timer;
    const load = async () => {
      try {
        const res = await fetch('/api/listings?limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        setListings(Array.isArray(json?.data) ? json.data : []);
      } catch { /* ignore */ }
    };
    load();
    timer = setInterval(load, 5000);
    return () => { alive = false; if (timer) clearInterval(timer); };
  }, []);

  // Cart count
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
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleDevice = (dev) => {
    setDevices(prev => {
      const next = new Set(prev);
      if (next.has(dev)) next.delete(dev); else next.add(dev);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return listings.filter((r) => {
      // search
      if (query) {
        const hay = `${r.name||''} ${r.headline||''} ${(r.categories||[]).join(' ')} ${(r.languages||[]).join(' ')} ${r.location||''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      // categories
      if (selectedCats.size) {
        const cat = (r.categories && r.categories[0] || '').toLowerCase();
        if (!selectedCats.has(cat)) return false;
      }
      if (age && (r.age_range || '') !== age) return false;
      if (sex && (r.sex || '') !== sex) return false;
      if (availability && (r.availability || '') !== availability) return false;
      if (language && !(r.languages||[]).includes(language)) return false;
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
      await fetch('/api/cart/items', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ listing_id:item.id, name:item.name, headline:item.headline||'', price: Number(item.hourly_rate||99) }) });
      const res = await fetch('/api/cart', { cache: 'no-store' });
      const json = await res.json();
      const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
      setCartCount(n);
      try { localStorage.setItem('cart_count', String(n)); } catch {}
    } catch {}
  }, []);

  // Constellation canvas (preserve exact visual)
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dots = [];
    const setup = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.offsetWidth : window.innerWidth;
      canvas.height = parent ? parent.offsetHeight : 300;
      dots = [];
      for (let i = 0; i < (canvas.width / 18); i++) {
        dots.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: -0.5+Math.random(), vy: -0.5+Math.random(), radius: Math.random()*1.5 });
      }
    };
    const tick = () => {
      if (!ctx) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      dots.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width) d.vx = -d.vx;
        if (d.y < 0 || d.y > canvas.height) d.vy = -d.vy;
        ctx.beginPath(); ctx.arc(d.x,d.y,d.radius,0,Math.PI*2);
        ctx.fillStyle = 'rgba(127, 90, 240, 0.6)'; ctx.fill();
      });
      for (let i=0;i<dots.length;i++) {
        for (let j=i+1;j<dots.length;j++) {
          const dist = Math.hypot(dots[i].x-dots[j].x, dots[i].y-dots[j].y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(127, 90, 240, ${0.8 - dist/120})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(dots[i].x,dots[i].y); ctx.lineTo(dots[j].x,dots[j].y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    let raf;
    setup(); tick();
    const onResize = () => setup();
    window.addEventListener('resize', onResize);
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <>
      <style jsx global>{`
        /* Additional styles for the shop page */
        .browse-hero {
          position: relative; overflow: hidden; padding: 80px 0; text-align: center;
        }
        #constellation { position: absolute; inset: 0; z-index: 1; opacity: 0.8;}
        .browse-hero-content { position: relative; z-index: 10; }
        .browse-hero h1 {
          font-family: "Space Grotesk", sans-serif; font-size: clamp(2.5rem, 5vw, 3.5rem);
          margin: 0 auto 12px; max-width: 700px;
        }
        .browse-hero .gradient-text {
          background: linear-gradient(120deg, var(--primary), var(--accent-1), var(--accent-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .browse-hero p { max-width: 550px; margin: 0 auto 32px; color: var(--muted); font-size: 18px;}
        .search-bar {
          max-width: 960px; margin: 0 auto;
          padding: 10px; border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
            linear-gradient(120deg, rgba(127,90,240,.10), rgba(0,198,207,.08));
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0,0,0,.35);
          backdrop-filter: saturate(140%) blur(8px);
          display: grid; grid-template-columns: 1fr; gap: 10px;
        }
        .search-input-wrap { position: relative; display: flex; align-items: center; background: var(--elev); border: 1px solid var(--border); border-radius: var(--pill); }
        .search-input-wrap:focus-within { outline: 2px solid color-mix(in oklab, var(--primary), white 25%); outline-offset: 2px; }
        .search-icon { position: absolute; left: 14px; color: var(--muted); width: 20px; height: 20px; pointer-events: none; }
        .clear-btn { position: absolute; right: 10px; display: none; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }
        .clear-btn:hover { color: var(--text); border-color: #444; background: rgba(255,255,255,0.04); }
        .input {
          width: 100%; padding: 14px 44px; border-radius: var(--pill); outline: none;
          border: 0; background: transparent;
          color: var(--text); transition: all .2s var(--ease-out); min-height: 52px;
        }
        .input::placeholder { color: color-mix(in oklab, var(--muted), #888 30%); }
        .btn-primary { background: var(--primary); border: 1px solid var(--primary); color: white; border-radius: 10px; font-weight: 600; padding: 12px 24px; cursor: pointer; transition: transform .2s var(--ease-out); min-height: 44px; }
        .btn-primary:hover { transform: scale(1.03); }
        @media (min-width: 900px) { .search-bar { grid-template-columns: 1fr auto; align-items: center; padding: 12px; } }

        /* Categories Section */
        .categories-section { padding: 0 0 80px; text-align: center; position: relative; z-index: 10; }
        .categories-section h2 { font-family: "Space Grotesk", sans-serif; font-size: 24px; margin-bottom: 24px; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        .category-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px;
          text-align: left; display: flex; align-items: center; gap: 12px;
          color: var(--muted); font-weight: 600; transition: all .2s var(--ease-out);
        }
        .category-card:hover { transform: translateY(-4px); background: var(--elev); border-color: #444; color: var(--text); }
        .category-card.active { background: var(--elev); border-color: color-mix(in oklab, var(--primary), #444 40%); color: var(--text); box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary), transparent 60%) inset; }
        .category-card span { font-size: 24px; } /* Emoji */

        /* Main Content Wrapper */
        .main-listings-area { padding: 48px 0; }

        /* Advanced Filters Bar */
        .filters-bar { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
        .filter-group { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--pill); padding: 8px 10px; }
        .filter-group legend, .filter-group .label { font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: .02em; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 8px; }
        label.chip { position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        label.chip input { position: absolute; opacity: 0; pointer-events: none; }
        label.chip span { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--pill); min-height: 36px; color: var(--text); background: var(--elev); font-weight: 500; }
        label.chip input:checked + span { background: var(--primary); border-color: var(--primary); color: #fff; }
        .filter-select { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--elev); color: var(--text); }
        .rate { display: flex; align-items: center; gap: 10px; }
        .rate input[type="range"] { width: 160px; }

        /* Listings */
        .listings-container {
          margin-top: var(--space-4);
          display: grid; grid-template-columns: 1fr; gap: var(--card-gap);
        }
        .listing-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: var(--card-pad);
          display: grid; grid-template-columns: auto 1fr; grid-template-areas: "avatar name" "avatar meta";
          align-items: center; gap: var(--card-gap);
          transition: all .2s var(--ease-out);
          container-type: inline-size;
        }
        .listing-card:hover {
          transform: translateY(-4px); box-shadow: var(--shadow);
          border-color: #444;
        }
        .listing-card .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .listing-card .name { font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: var(--text-lg); color: var(--text); }
        .listing-card .headline { color: var(--muted); margin-top: -2px; }
        .skills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .skill {
          font-size: 12px; padding: 6px 10px; border-radius: var(--pill);
          border: 1px solid var(--border); color: var(--muted); background: var(--elev);
        }
        .listing-meta { text-align: left; grid-area: meta; }
        .listing-meta .price { font-size: 20px; font-weight: 700; color: var(--text); }
        .listing-meta .rating { color: var(--muted); font-size: 14px; font-weight: 500; }

        @media (min-width: 900px) {
          .listing-card { grid-template-columns: auto 1fr auto; grid-template-areas: "avatar name meta"; }
          .listing-meta { text-align: right; }
        }

        /* Container query tuning for very narrow cards */
        @container (max-width: 380px) {
          .listing-card .avatar { width: 40px; height: 40px; }
          .listing-meta .price { font-size: 18px; }
          .btn-primary { padding: 10px 16px; }
        }

        /* Focus styles */
        :focus-visible { outline: 2px solid color-mix(in oklab, var(--primary), white 20%); outline-offset: 2px; }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal.in { transition: none !important; transform: none !important; }
          #constellation { display: none !important; }
        }
      `}</style>
      <header className="site-header">
        <div className="container nav-container">
          <a href="/" className="nav-brand" aria-label="Urzistaff home">
            <img src="/urzistaff-logo.png" data-fallback="/urzistaff-logo.png,/urzistaff-logo.jpg,/urzistaff-logo.jpeg,/logo.png,/logo.jpg" alt="Urzistaff" className="nav-brand-logo" />
            <span className="nav-brand-text" style={{display:'none'}}>Urzistaff</span>
          </a>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/shop" className="active">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support">Support</a>
          </nav>
          <a href="/cart" className="btn-cart" aria-label="Cart">
            <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25"/></svg>
            <span id="cartCount">{cartCount}</span>
          </a>
        </div>
      </header>
      <header className="browse-hero">
        <canvas id="constellation" ref={canvasRef} aria-hidden="true"></canvas>
        <div className="browse-hero-content reveal">
          <h1>Find your <span className="gradient-text">dedicated partner</span> in productivity.</h1>
          <p>We connect you with elite, pre-vetted virtual assistants who seamlessly integrate into your workflow.</p>
          <form className="search-bar" role="search" onSubmit={(e)=>e.preventDefault()}>
            <label className="sr-only" htmlFor="q">Search</label>
            <div className="search-input-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M10 2a8 8 0 105.293 14.293l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/></svg>
              <input id="q" name="q" className="input" type="search" placeholder="Search assistants by role, skills, location..." value={q} onChange={(e)=>setQ(e.target.value)} />
              {q && <button type="button" id="clearSearch" className="clear-btn" aria-label="Clear search" onClick={()=>setQ("")}>✕</button>}
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
              <a key={c.k} href="#" className={`category-card${selectedCats.has(c.k)?' active':''}`} data-category={c.k} onClick={(e)=>{e.preventDefault(); toggleCategory(c.k);}}><span>{c.label.split(' ')[0]}</span> {c.label.slice(c.label.indexOf(' ')+1)}</a>
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
                  <label key={v} className="chip"><input type="radio" name="age" value={v} checked={age===v} onChange={()=>setAge(v)} /><span>{v}</span></label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Sex</legend>
              <div className="filter-options">
                {['male','female'].map(v => (
                  <label key={v} className="chip"><input type="radio" name="sex" value={v} checked={sex===v} onChange={()=>setSex(v)} /><span>{v[0].toUpperCase()+v.slice(1)}</span></label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Device</legend>
              <div className="filter-options">
                {['windows','macos'].map(v => (
                  <label key={v} className="chip"><input type="checkbox" name="device" value={v} checked={devices.has(v)} onChange={()=>toggleDevice(v)} /><span>{v === 'macos' ? 'MacOS' : 'Windows'}</span></label>
                ))}
              </div>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Availability</legend>
              <div className="filter-options">
                {['full-time','part-time'].map(v => (
                  <label key={v} className="chip"><input type="radio" name="availability" value={v} checked={availability===v} onChange={()=>setAvailability(v)} /><span>{v === 'full-time' ? 'Full Time' : 'Part Time'}</span></label>
                ))}
              </div>
            </fieldset>
            <div className="filter-group">
              <div className="label">Location</div>
              <select className="filter-select" name="location" aria-label="Location" value={location} onChange={(e)=>setLocation(e.target.value)}>
                {['Select','United States','United Kingdom','Canada','Australia','Italy','Spain','Germany','France','Brazil','Mexico','India','Philippines','Japan','South Korea'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <fieldset className="filter-group">
              <legend>Language</legend>
              <div className="filter-options">
                {['English','Italian','Spanish'].map((v) => (
                  <label key={v} className="chip"><input type="radio" name="language" value={v.toLowerCase()} checked={language===v} onChange={()=>setLanguage(v)} /><span>{v}</span></label>
                ))}
              </div>
            </fieldset>
            <div className="filter-group rate">
              <div className="label">Hourly Rate</div>
              <input type="range" min="0" max="100" step="1" id="rateRange" aria-label="Hourly Rate" value={maxRate} onChange={(e)=>setMaxRate(Number(e.target.value))} />
              <div id="rateValue">${""+maxRate}/hr</div>
            </div>
          </div>
          <div className="listings-container reveal">
            {filtered.map((r) => (
              <article key={r.id} className="listing-card" data-category={(r.categories&&r.categories[0])||''} data-age={r.age_range||''} data-sex={r.sex||''} data-device={(r.devices||[]).join(',')} data-availability={r.availability||''} data-location={r.location||''} data-language={(r.languages&&r.languages[0])||''} data-rate={r.hourly_rate ?? ''} style={{position:'relative'}}>
                <a className="card-link" href={`/p/${r.id}`} aria-label={`View ${r.name} profile`} style={{position:'absolute',inset:0,zIndex:5,borderRadius:'inherit'}}><span className="sr-only">View profile</span></a>
                <img loading="lazy" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.name||'VA')}`} alt={r.name} className="avatar" />
                <div>
                  <div className="name">{r.name}</div>
                  {r.headline ? <div className="headline">{r.headline}</div> : null}
                  <div className="skills">
                    {(r.categories||[]).slice(0,3).map((c) => (<span key={c} className="skill">{c}</span>))}
                    {(r.languages||[]).slice(0,2).map((l) => (<span key={l} className="skill">{l}</span>))}
                  </div>
                </div>
                <div className="listing-meta">
                  <div className="price">${Number(r.hourly_rate ?? 0).toFixed(0)}<span style={{fontSize:14,color:'var(--muted)'}}>/hr</span></div>
                  {r.rating ? <div className="rating">⭐ {r.rating} ({r.reviews_count} reviews)</div> : null}
                  <button className="btn-primary" type="button" style={{marginTop:8, position:'relative', zIndex:6}} onClick={(e)=>{e.preventDefault(); e.stopPropagation(); addToCart(r);}}>Add to Cart</button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="card">No listings found.</div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}