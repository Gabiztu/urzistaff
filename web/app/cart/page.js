"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountMsg, setDiscountMsg] = useState("");
  const [discountOk, setDiscountOk] = useState(true);
  const [cartCount, setCartCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const n = parseInt(window.localStorage?.getItem('cart_count') || '0', 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  });

  const UNIT_PRICE = 99;

  const getLS = useCallback(() => {
    try { return parseInt(localStorage.getItem("cart_count") || "0", 10) || 0; } catch { return 0; }
  }, []);
  const setLS = useCallback((n) => {
    try { localStorage.setItem("cart_count", String(Math.max(0, n|0))); } catch {}
  }, []);

  const avatar = useCallback((name) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name||'VA')}`,[ ]);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { cache: 'no-store' });
      const json = await res.json();
      const list = Array.isArray(json?.cart?.items) ? json.cart.items : [];
      setItems(list);
      setCartCount(list.length);
      setLS(list.length);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [setLS]);

  useEffect(() => {
    setCartCount(getLS());
    const saved = (typeof localStorage !== 'undefined' ? (localStorage.getItem('discount_code')||'') : '').trim();
    setDiscountCode(saved);
    if (saved) {
      const upper = saved.toUpperCase();
      setDiscountOk(upper === 'URZI10' || upper === 'WELCOME10' || upper === 'URZI20');
      setDiscountMsg(upper === 'URZI10' || upper === 'WELCOME10' || upper === 'URZI20' ? 'Discount applied' : 'Invalid code');
    } else {
      setDiscountMsg("");
    }
    loadCart();
  }, [getLS, loadCart]);

  const removeItem = useCallback(async (listing_id) => {
    try {
      await fetch(`/api/cart/items?listing_id=${encodeURIComponent(listing_id)}`, { method: 'DELETE' });
    } finally {
      await loadCart();
    }
  }, [loadCart]);

  const discountInfo = useMemo(() => {
    const code = (discountCode || '').trim().toUpperCase();
    let pct = 0;
    if (code === 'URZI10' || code === 'WELCOME10') pct = 0.10;
    else if (code === 'URZI20') pct = 0.20;
    return { code, pct };
  }, [discountCode]);

  const subtotal = useMemo(() => items.length * UNIT_PRICE, [items]);
  const discountAmount = useMemo(() => +(subtotal * discountInfo.pct).toFixed(2), [subtotal, discountInfo]);
  const fees = 0;
  const total = Math.max(0, subtotal - discountAmount + fees);

  const checkoutHref = useMemo(() => {
    if (items.length === 0) return undefined;
    const p = new URLSearchParams();
    const it = items[0];
    p.set('id', it.listing_id || it.id);
    p.set('name', it.name || 'Listing');
    p.set('headline', it.headline || '');
    p.set('price', String(UNIT_PRICE));
    return `/checkout?${p.toString()}`;
  }, [items]);

  const brandImgRef = useRef(null);
  const onBrandError = useCallback((e) => {
    const img = e.currentTarget;
    const list = (img.dataset.fallback || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (list.length) {
      img.dataset.fallback = list.slice(1).join(',');
      img.src = list[0];
    } else {
      img.style.display = 'none';
      const wrap = img.closest('.nav-brand');
      const t = wrap ? wrap.querySelector('.nav-brand-text') : null;
      if (t) t.style.display = 'inline-block';
    }
  }, []);

  const applyDiscount = useCallback(() => {
    const val = (discountCode || '').trim();
    try { localStorage.setItem('discount_code', val); } catch {}
    const upper = val.toUpperCase();
    const ok = upper === 'URZI10' || upper === 'WELCOME10' || upper === 'URZI20';
    setDiscountOk(!!val && ok);
    setDiscountMsg(val ? (ok ? 'Discount applied' : 'Invalid code') : '');
  }, [discountCode]);

  return (
    <>
      <header className="site-header">
        <div className="container nav-container">
          <a href="/" className="nav-brand" aria-label="Urzistaff home">
            <img
              ref={brandImgRef}
              src="/urzistaff-logo.png"
              data-fallback="/urzistaff-logo.jpg,/urzistaff-logo.jpeg,/logo.png,/logo.jpg"
              alt="Urzistaff"
              className="nav-brand-logo"
              onError={onBrandError}
            />
            <span className="nav-brand-text" style={{display:'none'}}>Urzistaff</span>
          </a>
          <nav className="nav-links">
            <a href="/">Home</a>
            <a href="/shop">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support">Support</a>
          </nav>
          <a href="/cart" className="btn-cart" aria-label="Cart">
            <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.344 1.087-.849l1.858-6.443a.75.75 0 0 0-.7-1.028H5.613M15 21a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0h-5.25"/></svg>
            <span id="cartCount" style={{visibility: cartCount===null ? 'hidden' : 'visible'}}>{cartCount ?? ''}</span>
          </a>
        </div>
      </header>

      <div className="container page">
        <header style={{textAlign:'center', marginBottom:48}}>
          <h1><span className="gradient-text">Review Your Cart</span></h1>
          <p><a href="/shop">← Or continue browsing</a></p>
        </header>

        <div className="cart-layout">
          <main className="cart-items">
            <h2 id="itemsTitle">Your Items ({items.length})</h2>
            {loading ? (
              <div className="card" style={{textAlign:'center'}}>Loading…</div>
            ) : error ? (
              <div className="card" style={{textAlign:'center', color:'#F04E8A'}}>Failed to load cart</div>
            ) : (
              <div id="itemsList" className="cart-items-list">
                {items.map((it) => (
                  <div key={it.listing_id || it.id} className="cart-item-card">
                    <img loading="lazy" src={avatar(it.name)} alt={it.name} className="avatar" />
                    <div>
                      <div className="name">{it.name}</div>
                      {it.headline ? <div className="headline">{it.headline}</div> : null}
                    </div>
                    <div className="price">
                      <div>{`$${UNIT_PRICE.toFixed(2)}`}</div>
                      <a href="#" className="remove-link" onClick={(e)=>{e.preventDefault(); removeItem(it.listing_id)}}>Remove</a>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="card" style={{textAlign:'center'}}>Your cart is empty.</div>
                )}
              </div>
            )}
          </main>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            <div className="price-details">
              <div className="price-row"><div className="label">Subtotal</div><div className="value">{`$${subtotal.toFixed(2)}`}</div></div>
              {discountAmount > 0 && (
                <div className="price-row"><div className="label">Discount</div><div className="value">{`-$${discountAmount.toFixed(2)}`}</div></div>
              )}
              <div className="price-row"><div className="label">Taxes & Fees</div><div className="value">{`$${fees.toFixed(2)}`}</div></div>
              <div className="price-row total"><div className="label">Total</div><div className="value">{`$${total.toFixed(2)}`}</div></div>
            </div>
            <div className="form-group" style={{marginTop:10}}>
              <label htmlFor="discountCode" style={{display:'block', fontWeight:600, marginBottom:6, fontSize:14}}>Discount code</label>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <input id="discountCode" className="input" placeholder="Enter code" style={{flex:1, minHeight:40}}
                  value={discountCode}
                  onChange={(e)=>setDiscountCode(e.target.value)}
                  onBlur={applyDiscount}
                />
                <button className="btn-primary btn-sm" type="button" style={{minWidth:92}} onClick={()=>{applyDiscount();}}>
                  Apply
                </button>
              </div>
              {discountMsg ? (
                <p className="helper-text" style={{marginTop:6, color: discountOk ? 'var(--muted)' : 'var(--accent-2)'}}>{discountMsg}</p>
              ) : null}
            </div>
            <a className="btn-primary" aria-disabled={items.length === 0} href={checkoutHref} style={{marginTop:32}} onClick={(e)=>{ if(items.length===0){ e.preventDefault(); } }}>
              Proceed to Checkout
            </a>
            <p className="info-text">This is a one-time fee to connect with the assistant.</p>
          </aside>
        </div>
      </div>

      
    </>
  );
}
