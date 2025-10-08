"use client";
import { useEffect, useMemo, useState } from "react";

const UNIT_PRICE = 99;

export default function ClientCart({ initialCart }) {
  const [items, setItems] = useState(initialCart?.items || []);
  const [code, setCode] = useState("");

  useEffect(() => {
    try { setCode(localStorage.getItem('discount_code') || ''); } catch {}
    try { localStorage.setItem('cart_count', String(items.length)); } catch {}
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = String(items.length);
  }, [items]);

  const { subtotal, discountAmt, total } = useMemo(() => {
    const subtotal = items.length * UNIT_PRICE;
    const uc = (code || '').trim().toUpperCase();
    let pct = 0;
    if (uc === 'URZI10' || uc === 'WELCOME10') pct = 0.10;
    else if (uc === 'URZI20') pct = 0.20;
    const discountAmt = +(subtotal * pct).toFixed(2);
    const total = Math.max(0, subtotal - discountAmt);
    return { subtotal, discountAmt, total };
  }, [items, code]);

  const removeItem = async (listing_id) => {
    try {
      await fetch(`/api/cart/items?listing_id=${encodeURIComponent(listing_id)}`, { method: 'DELETE' });
    } finally {
      setItems((prev) => prev.filter((x) => String(x.listing_id) !== String(listing_id)));
    }
  };

  const applyCode = () => {
    try { localStorage.setItem('discount_code', code.trim()); } catch {}
  };

  return (
    <>
      <div id="itemsList" className="cart-items-list">
        {items.map((it) => (
          <div key={it.listing_id || it.id} className="cart-item-card">
            <img loading="lazy" src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(it.name||'VA')}`} alt={it.name} className="avatar" />
            <div>
              <div className="name">{it.name}</div>
              <div className="headline">{it.headline || ''}</div>
            </div>
            <div className="price">
              <div>${UNIT_PRICE.toFixed(2)}</div>
              <a href="#" className="remove-link" onClick={(e) => { e.preventDefault(); removeItem(it.listing_id); }}>Remove</a>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="cart-item-card" style={{justifyContent:'center', color:'var(--muted)'}}>Your cart is empty.</div>
        )}
      </div>
      {/* Sync order summary values */}
      <script dangerouslySetInnerHTML={{__html: `
        (function(){
          var sub = document.getElementById('subtotalVal');
          var disc = document.getElementById('discountVal');
          var discRow = document.getElementById('discountRow');
          var fees = document.getElementById('feesVal');
          var tot = document.getElementById('totalVal');
          if (sub) sub.textContent = '$${subtotal.toFixed(2)}';
          if (disc) disc.textContent = '-$${discountAmt.toFixed(2)}';
          if (discRow) discRow.style.display = ${discountAmt > 0 ? "''" : "'none'"};
          if (fees) fees.textContent = '$0.00';
          if (tot) tot.textContent = '$${total.toFixed(2)}';
          var btn = document.getElementById('toCheckout');
          if (btn) { if (${items.length} === 0) { btn.setAttribute('aria-disabled','true'); btn.removeAttribute('href'); } else { btn.setAttribute('aria-disabled','false'); btn.setAttribute('href','/checkout'); } }
          var title = document.getElementById('itemsTitle'); if (title) title.textContent = 'Your Items (${items.length})';
        })();
      `}} />

      <div className="form-group" style={{marginTop:10}}>
        <label style={{display:'block',fontWeight:600,marginBottom:6,fontSize:14}}>Discount code</label>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input className="input" placeholder="Enter code" style={{flex:1,minHeight:40}} value={code} onChange={(e)=>setCode(e.target.value)} />
          <button className="btn-primary btn-sm" type="button" style={{minWidth:92}} onClick={applyCode}>Apply</button>
        </div>
      </div>
    </>
  );
}
