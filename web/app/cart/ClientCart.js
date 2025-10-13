"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function ClientCart() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [valid, setValid] = useState(false);
  const [pct, setPct] = useState(0);
  const [checking, setChecking] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const getLS = () => {
    try { return parseInt(localStorage.getItem("cart_count") || "0", 10) || 0; } catch { return 0; }
  };
  const setLS = (n) => {
    try { localStorage.setItem("cart_count", String(Math.max(0, n|0))); } catch {}
  };

  const avatar = (name) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name||'VA')}`;

  const codeUpper = (code || '').trim().toUpperCase();

  const subtotal = useMemo(() => (cart || []).reduce((s, it) => s + Number(it.price || 0), 0), [cart]);
  const discAmt = valid ? +(subtotal * pct).toFixed(2) : 0;
  const fees = 0;
  const total = Math.max(0, subtotal - discAmt + fees);

  const format = (n) => `$${Number(n||0).toFixed(2)}`;
  const formatNeg = (n) => `-$${Number(Math.abs(n)||0).toFixed(2)}`;

  // Load initial code from localStorage and validate
  useEffect(() => {
    try { setCode((localStorage.getItem('discount_code') || '').trim()); } catch {}
  }, []);
  useEffect(() => {
    const init = async () => {
      const c = (code || '').trim();
      if (!c) { setValid(false); setPct(0); return; }
      try {
        setChecking(true);
        const res = await fetch(`/api/discount-codes/validate?code=${encodeURIComponent(c)}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.valid) { setValid(true); setPct(Number(json.pct || 0.10)); }
        else { setValid(false); setPct(0); }
      } finally { setChecking(false); }
    };
    init();
  }, [code]);

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

  const applyDiscount = async () => {
    const c = (code || '').trim();
    if (!c) { setMsg(''); setValid(false); setPct(0); try { localStorage.removeItem('discount_code'); } catch {} return; }
    try {
      setChecking(true);
      const res = await fetch(`/api/discount-codes/validate?code=${encodeURIComponent(c)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json?.valid) {
        setValid(true);
        setPct(Number(json.pct || 0.10));
        setMsg('Discount applied');
        try { localStorage.setItem('discount_code', c); } catch {}
      } else {
        setValid(false);
        setPct(0);
        setMsg('Invalid code');
        try { localStorage.removeItem('discount_code'); } catch {}
      }
    } finally { setChecking(false); }
  };

  // Build checkout URL using first item
  const checkoutHref = useMemo(() => (cart.length > 0 ? '/checkout' : undefined), [cart.length]);
  const [reserving, setReserving] = useState(false);
  const goCheckout = async (e) => {
    e.preventDefault();
    if (!checkoutHref || reserving) return;
    try {
      setReserving(true);
      const res = await fetch('/api/checkout/reserve', { method: 'POST' });
      const json = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to reserve');
      window.location.href = checkoutHref;
    } catch (err) {
      alert((err && err.message) || 'Items became unavailable. Please refresh your cart.');
    } finally {
      setReserving(false);
    }
  };

  return (
    <>
      <div className="page-shell cart-page has-mobile-nav">
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
                      <div>{format(item.price)}</div>
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
                <div className="price-row" style={{display: discAmt > 0 ? '' : 'none'}}>
                  <div className="label">Discount{discAmt > 0 ? ` (${codeUpper} - ${Math.round((pct||0)*100)}%)` : ''}</div>
                  <div className="value">{formatNeg(discAmt)}</div>
                </div>
                <div className="price-row"><div className="label">Taxes & Fees</div><div className="value">{format(fees)}</div></div>
                <div className="price-row total"><div className="label">Total</div><div className="value">{format(total)}</div></div>
              </div>
              <div className="form-group" style={{marginTop:10}}>
                <label htmlFor="discountCode" style={{display:'block',fontWeight:600,marginBottom:6,fontSize:14}}>Discount code</label>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input id="discountCode" className="input" placeholder="Enter code" style={{flex:1,minHeight:40}} value={code} onChange={(e)=>setCode(e.target.value)} />
                  <button className="btn-primary btn-sm" type="button" onClick={applyDiscount} disabled={checking}>{checking? '...' : 'Apply'}</button>
                </div>
                {msg ? <p className="helper-text" style={{marginTop:6,color: msg==='Discount applied'?'var(--muted)':'var(--accent-2)'}}>{msg}</p> : null}
              </div>
              {checkoutHref ? (
                <a className="btn-primary" href={checkoutHref} onClick={goCheckout} style={{marginTop:32}} aria-disabled={reserving?"true":undefined}>{reserving? 'Reserving…' : 'Proceed to Checkout'}</a>
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

    </>
  );
}
