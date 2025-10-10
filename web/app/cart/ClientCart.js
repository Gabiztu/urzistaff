"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

const UNIT_PRICE = 99;

export default function ClientCart() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const getLS = () => {
    try { return parseInt(localStorage.getItem("cart_count") || "0", 10) || 0; } catch { return 0; }
  };
  const setLS = (n) => {
    try { localStorage.setItem("cart_count", String(Math.max(0, n|0))); } catch {}
  };

  const avatar = (name) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name||'VA')}`;

  const discountFor = (subtotal) => {
    const codeUp = (code || "").trim().toUpperCase();
    let pct = 0;
    if (codeUp === "URZI10" || codeUp === "WELCOME10") pct = 0.10;
    else if (codeUp === "URZI20") pct = 0.20;
    const amt = +(subtotal * pct).toFixed(2);
    return { code: codeUp, amount: amt, pct };
  };

  const subtotal = useMemo(() => cart.length * UNIT_PRICE, [cart.length]);
  const { amount: discAmt } = discountFor(subtotal);
  const fees = 0;
  const total = Math.max(0, subtotal - discAmt + fees);

  const format = (n) => `$${Number(n||0).toFixed(2)}`;
  const formatNeg = (n) => `-$${Number(Math.abs(n)||0).toFixed(2)}`;

  // Load initial code from localStorage
  useEffect(() => {
    try { setCode((localStorage.getItem('discount_code') || '').trim()); } catch {}
  }, []);

  // Header cart count: hydrate from localStorage, then sync from API
  useEffect(() => {
    setCartCount(getLS());
    const load = async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const json = await res.json();
        const items = Array.isArray(json?.cart?.items) ? json.cart.items : [];
        setCart(items);
        setCartCount(items.length);
        setLS(items.length);
      } catch {
        setCart([]);
      }
    };
    load();
  }, []);

  // Close mobile menu when clicking outside or resizing to desktop
  useEffect(() => {
    const onDoc = (e) => {
      const btn = btnRef.current;
      const panel = panelRef.current;
      if (!btn || !panel) return;
      if (!panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    document.addEventListener("click", onDoc);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const removeItem = async (listing_id) => {
    try {
      await fetch(`/api/cart/items?listing_id=${encodeURIComponent(listing_id)}`, { method: 'DELETE' });
    } finally {
      // reload
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const json = await res.json();
        const items = Array.isArray(json?.cart?.items) ? json.cart.items : [];
        setCart(items);
        setCartCount(items.length);
        setLS(items.length);
      } catch {}
    }
  };

  const applyDiscount = () => {
    try { localStorage.setItem('discount_code', (code||'').trim()); } catch {}
    const { pct } = discountFor(100);
    if (code && pct > 0) setMsg('Discount applied');
    else if (code) setMsg('Invalid code');
    else setMsg('');
  };

  // Build checkout URL using first item
  const checkoutHref = useMemo(() => {
    if (cart.length === 0) return undefined;
    const first = cart[0];
    const params = new URLSearchParams();
    params.set('id', first.listing_id || first.id);
    params.set('name', first.name || '');
    params.set('headline', first.headline || '');
    params.set('price', String(UNIT_PRICE));
    return `/checkout?${params.toString()}`;
  }, [cart]);

  return (
    <>
      <div className="page-shell">
        <header className="site-header">
          <div className="container nav-container">
            <a href="/" className="nav-brand" aria-label="UrziStaff home">
              <span className="nav-brand-text">UrziStaff</span>
            </a>
            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="/shop">Shop</a>
              <a href="/faq">FAQ</a>
              <a href="/support">Support</a>
            </nav>
            <button
              type="button"
              className="menu-btn"
              id="menuBtn"
              aria-label="Open menu"
              aria-expanded={mobileOpen ? "true" : "false"}
              onClick={() => setMobileOpen((v) => !v)}
              ref={btnRef}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
            <a href="/cart" className="btn-cart" aria-label="Cart">
              <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25"/></svg>
              <span id="cartCount">{cartCount}</span>
            </a>
          </div>
          <nav className={"mobile-nav" + (mobileOpen ? " open" : "")} id="mobileNav" ref={panelRef}>
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support" onClick={() => setMobileOpen(false)}>Support</a>
          </nav>
        </header>

        <div className="container page">
          <header style={{textAlign:'center', paddingTop:64, marginBottom:48}}>
            <h1><span className="gradient-text">Review Your Cart</span></h1>
            <p><a href="/shop">← Or continue browsing</a></p>
          </header>

          <div className="cart-layout">
            <main className="cart-items">
              <h2 id="itemsTitle">Your Items ({cart.length})</h2>
              <div id="itemsList" className="cart-items-list">
                {cart.map((item) => (
                  <div className="cart-item-card" key={item.listing_id || item.id}>
                    <img loading="lazy" src={avatar(item.name)} alt={item.name} className="avatar" />
                    <div>
                      <div className="name">{item.name}</div>
                      <div className="headline">{item.headline || ''}</div>
                    </div>
                    <div className="price">
                      <div>{format(UNIT_PRICE)}</div>
                      <a href="#" className="remove-link" onClick={(e) => { e.preventDefault(); removeItem(item.listing_id || item.id); }}>Remove</a>
                    </div>
                  </div>
                ))}
              </div>
            </main>

            <aside className="order-summary">
              <h2>Order Summary</h2>
              <div className="price-details">
                <div className="price-row"><div className="label">Subtotal</div><div className="value">{format(subtotal)}</div></div>
                <div className="price-row" style={{display: discAmt > 0 ? '' : 'none'}}><div className="label">Discount</div><div className="value">{formatNeg(discAmt)}</div></div>
                <div className="price-row"><div className="label">Taxes & Fees</div><div className="value">{format(fees)}</div></div>
                <div className="price-row total"><div className="label">Total</div><div className="value">{format(total)}</div></div>
              </div>
              <div className="form-group" style={{marginTop:10}}>
                <label htmlFor="discountCode" style={{display:'block',fontWeight:600,marginBottom:6,fontSize:14}}>Discount code</label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input id="discountCode" className="input" placeholder="Enter code" style={{flex:1,minHeight:40}} value={code} onChange={(e)=>setCode(e.target.value)} />
                  <button className="btn-primary btn-sm" type="button" onClick={applyDiscount}>Apply</button>
                </div>
                {msg ? <p className="helper-text" style={{marginTop:6,color: msg==='Discount applied'?'var(--muted)':'var(--accent-2)'}}>{msg}</p> : null}
              </div>
              {checkoutHref ? (
                <a className="btn-primary" href={checkoutHref} style={{marginTop:32}} aria-disabled="false">Proceed to Checkout</a>
              ) : (
                <a className="btn-primary" style={{marginTop:32}} aria-disabled="true">Proceed to Checkout</a>
              )}
              <p className="info-text">This is a one-time fee to connect with the assistant.</p>
            </aside>
          </div>
        </div>

        <div className="footer-push">
          <ThemeToggle />
        </div>
      </div>

      <style jsx>{`
        .page-shell{min-height:100vh;display:flex;flex-direction:column;align-items:stretch}
        .page-shell>*{width:100%}
        .footer-push{margin-top:auto}
        .menu-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 10px;margin-left:auto;margin-right:10px}
        @media(min-width:768px){.menu-btn{display:none}}
        .mobile-nav{display:none;position:absolute;top:100%;left:12px;right:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;box-shadow:var(--shadow)}
        .mobile-nav a{display:block;padding:10px 12px;color:var(--text);border-radius:8px;text-align:center;text-decoration:none}
        .mobile-nav a:hover,.mobile-nav a.active{background:var(--elev)}
        .mobile-nav.open{display:flex;flex-direction:column;gap:6px}
        .nav-container{position:relative}
        /* Use global default alignment; no per-item drift */
        .cart-layout{display:flex;align-items:flex-start;gap:24px;flex-wrap:nowrap}
        .cart-items{flex:1 1 auto;min-width:0;max-width:560px}
        .order-summary{flex:0 0 360px;max-width:360px;margin-left:auto}
        @media(max-width:900px){.cart-layout{flex-direction:column}}
        @media(max-width:900px){.order-summary{flex:1 1 auto;max-width:none;margin-left:0}}
        /* Discount row: make input wider and Apply button compact */
        .order-summary .form-group .input{flex:1 1 auto;min-width:0}
        .order-summary .form-group .btn-primary.btn-sm{width:auto;min-width:auto;flex:0 0 auto;padding:8px 12px}
      `}</style>
    </>
  );
}
