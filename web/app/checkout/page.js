"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [formValid, setFormValid] = useState(false);
  const formRef = useRef(null);
  const noteRef = useRef(null);
  const noteToggleRef = useRef(null);

  const UNIT_PRICE = 99;

  const getLS = useCallback(() => { try { return parseInt(localStorage.getItem('cart_count')||'0',10)||0;} catch { return 0;}}, []);
  const setLS = useCallback((n) => { try { localStorage.setItem('cart_count', String(Math.max(0,n|0))); } catch {} }, []);

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
    loadCart();
  }, [getLS, loadCart]);

  const subtotal = useMemo(() => items.length * UNIT_PRICE, [items]);
  const fees = 0;
  const total = subtotal + fees;

  const brandOnError = useCallback((e)=>{
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

  const isFormValid = useCallback(() => {
    const form = formRef.current;
    if (!form) return true;
    return form.checkValidity();
  }, []);

  const onConfirmPay = useCallback(async (e)=>{
    e.preventDefault();
    if (items.length === 0) return;
    const form = formRef.current;
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    try {
      const payload = {};
      if (form) {
        payload.fullName = form.querySelector('#fullName')?.value || undefined;
        payload.telegram = form.querySelector('#telegram')?.value || undefined;
        const noteOn = form.querySelector('#addNoteToggle')?.checked;
        payload.note = noteOn ? (form.querySelector('#orderNote')?.value || '').trim() : undefined;
      }
      const res = await fetch('/api/checkout/nowpayments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json().catch(()=>({}));
      const invoiceUrl = json?.invoice_url || json?.url;
      if (!res.ok || !invoiceUrl) throw new Error(json?.error || 'Failed to create invoice');
      window.location.href = invoiceUrl;
    } catch (err) {
      alert((err && err.message) || 'Failed to start payment. Please try again.');
    }
  }, [items.length]);

  useEffect(()=>{
    const toggle = noteToggleRef.current;
    const area = noteRef.current;
    if (!toggle || !area) return;
    const sync = () => { area.style.display = toggle.checked ? '' : 'none'; };
    toggle.addEventListener('change', sync);
    sync();
    return () => toggle.removeEventListener('change', sync);
  }, []);

  // Track form validity live so the button enables only when EVERY field is filled and valid
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
    const update = () => setFormValid(form.checkValidity());
    inputs.forEach((el) => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
      el.addEventListener('blur', update);
    });
    update();
    return () => {
      inputs.forEach((el) => {
        el.removeEventListener('input', update);
        el.removeEventListener('change', update);
        el.removeEventListener('blur', update);
      });
    };
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="container-wide nav-container">
          <a href="/" className="nav-brand" aria-label="Urzistaff home">
            <img src="/urzistaff-logo.png" data-fallback="/urzistaff-logo.jpg,/urzistaff-logo.jpeg,/logo.png,/logo.jpg" alt="Urzistaff" className="nav-brand-logo" onError={brandOnError} />
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
            <span>{cartCount}</span>
          </a>
        </div>
      </header>

      <div className="container">
        <header style={{textAlign:'left', marginBottom:24}}>
          <h1><span className="gradient-text">Secure Checkout</span></h1>
          <p style={{color:'var(--muted)', fontSize:15, margin:0}}>You're one step away from boosting your productivity.</p>
        </header>

        <div className="checkout-layout">
          <main className="payment-form">
            <form id="checkoutForm" ref={formRef} action="#" method="POST">
              <div className="form-section">
                <h2>Contact information</h2>
                <p className="helper-text">We'll use this Telegram username to send you order details and updates.</p>
                <div className="form-group" style={{marginTop:10}}>
                  <label htmlFor="telegram">Telegram Username</label>
                  <input type="text" id="telegram" name="telegram" className="input" placeholder="@username" required pattern="^@[A-Za-z][A-Za-z0-9_]{4,31}$" title="Must start with @, begin with a letter, and be 5–32 characters using letters, numbers, or underscore" />
                  <p className="helper-text">You are currently checking out as a guest.</p>
                </div>
              </div>

              <div className="form-section">
                <h2>Billing Information</h2>
                <div className="form-row" style={{marginBottom:12}}>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input type="text" id="fullName" name="fullName" className="input" placeholder="John M. Doe" required pattern="^[A-Za-z' -]+$" title="Only letters, spaces, hyphens (-), and apostrophes (') are allowed" inputMode="text" autoComplete="name" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input type="text" id="address" name="address" className="input" placeholder="123 Main Street" required />
                </div>
                <div className="form-row" style={{marginBottom:12}}>
                  <div className="form-group" style={{flex:1}}>
                    <label htmlFor="country">Country</label>
                    <select id="country" name="country" className="input" required defaultValue="">
                      <option value="" disabled>Select your country</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Australia</option>
                      <option>New Zealand</option>
                      <option>Ireland</option>
                      <option>Germany</option>
                      <option>France</option>
                      <option>Italy</option>
                      <option>Spain</option>
                      <option>Portugal</option>
                      <option>Netherlands</option>
                      <option>Belgium</option>
                      <option>Switzerland</option>
                      <option>Austria</option>
                      <option>Sweden</option>
                      <option>Norway</option>
                      <option>Denmark</option>
                      <option>Finland</option>
                      <option>Poland</option>
                      <option>Czechia</option>
                      <option>Romania</option>
                      <option>Greece</option>
                      <option>Hungary</option>
                      <option>Bulgaria</option>
                      <option>Croatia</option>
                      <option>Serbia</option>
                      <option>Turkey</option>
                      <option>Ukraine</option>
                      <option>Russia</option>
                      <option>Brazil</option>
                      <option>Mexico</option>
                      <option>Argentina</option>
                      <option>Chile</option>
                      <option>Colombia</option>
                      <option>Peru</option>
                      <option>Philippines</option>
                      <option>India</option>
                      <option>Indonesia</option>
                      <option>Malaysia</option>
                      <option>Singapore</option>
                      <option>Thailand</option>
                      <option>Vietnam</option>
                      <option>Japan</option>
                      <option>South Korea</option>
                      <option>China</option>
                      <option>South Africa</option>
                      <option>Nigeria</option>
                      <option>Kenya</option>
                      <option>Egypt</option>
                      <option>United Arab Emirates</option>
                    </select>
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label htmlFor="region">State/County/Province</label>
                    <input type="text" id="region" name="region" className="input" placeholder="State / County / Province" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input type="text" id="city" name="city" className="input" placeholder="New York" required pattern="^[A-Za-z ]+$" title="Only letters and spaces are allowed" inputMode="text" autoComplete="address-level2" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zip">ZIP Code</label>
                    <input type="text" id="zip" name="zip" className="input" placeholder="10001" required />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Payment options</h2>
                <label className="pay-option" htmlFor="pay-now">
                  <input type="radio" id="pay-now" name="payment" value="nowpayments" defaultChecked hidden />
                  <div className="pay-card">
                    <div className="pay-icon" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8.009 8.009 0 0 1-8 8Z" fill="currentColor"/>
                        <path d="M12 6a1 1 0 0 0-1 1v3H9a1 1 0 0 0 0 2h2v3a1 1 0 0 0 2 0v-3h2a1 1 0 0 0 0-2h-2V7a1 1 0 0 0-1-1Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="pay-meta">
                      <div className="pay-title">NOWPayments</div>
                      <div className="pay-desc">Pay with NOWPayments</div>
                    </div>
                    <div className="pay-check" aria-hidden="true">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </label>
                <div className="form-group" style={{marginTop:14}}>
                  <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer',userSelect:'none'}}>
                    <input type="checkbox" id="addNoteToggle" ref={noteToggleRef} style={{width:16,height:16}} /> Add a note to your order
                  </label>
                  <textarea id="orderNote" ref={noteRef} className="input" placeholder="Notes about your order." style={{display:'none',minHeight:90,resize:'vertical'}} />
                </div>
                <p className="legal-text">By proceeding with your purchase you agree to our <a href="/terms" target="_blank" rel="noopener">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
              </div>
            </form>
          </main>

          <aside className="order-summary">
            <h2>Order Summary</h2>
            <h3 className="items-title">Items (<span>{items.length}</span>)</h3>
            <div className="items-list">
              {items.map((it) => (
                <div key={it.listing_id || it.id} className="item-row">
                  <div className="name">{it.name || 'Listing'}</div>
                  <div className="price">{`$${UNIT_PRICE.toFixed(2)}`}</div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="item-row" style={{justifyContent:'center', color:'var(--muted)'}}>Your cart is empty.</div>
              )}
            </div>
            <div className="price-details">
              <div className="price-row"><div className="label">Order Date</div><div className="value">{new Date().toLocaleString()}</div></div>
              <div className="price-row"><div className="label">Subtotal</div><div className="value">{`$${subtotal.toFixed(2)}`}</div></div>
              <div className="price-row"><div className="label">Taxes & Fees</div><div className="value">{`$${fees.toFixed(2)}`}</div></div>
              <div className="price-row total"><div className="label">Total</div><div className="value">{`$${total.toFixed(2)}`}</div></div>
            </div>
            <a href="/cart" className="btn-secondary">Return to cart</a>
            <button className="btn-primary" type="submit" form="checkoutForm" onClick={onConfirmPay} disabled={items.length===0 || !formValid} style={{marginTop:8}}>Confirm and Pay</button>
            <div className="secure-info">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9A9 9 0 0 0 12 1zm0 16a7 7 0 0 1-7-7 7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7z"/><path d="M12 7a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
              <span>Payments are secure and encrypted.</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
