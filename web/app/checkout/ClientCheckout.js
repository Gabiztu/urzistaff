"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function ClientCheckout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [code, setCode] = useState("");
  const [valid, setValid] = useState(false);
  const [pct, setPct] = useState(0);

  // Form state
  const [telegram, setTelegram] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [addNote, setAddNote] = useState(false);
  const [note, setNote] = useState("");

  const [nameErr, setNameErr] = useState("");
  const [cityErr, setCityErr] = useState("");
  const [tgErr, setTgErr] = useState("");

  const formRef = useRef(null);
  const nameRef = useRef(null);
  const cityRef = useRef(null);
  const tgRef = useRef(null);

  const getLS = () => {
    try { return parseInt(localStorage.getItem("cart_count") || "0", 10) || 0; } catch { return 0; }
  };
  const setLS = (n) => {
    try { localStorage.setItem("cart_count", String(Math.max(0, n|0))); } catch {}
  };

  const format = (n) => `$${Number(n||0).toFixed(2)}`;

  // Load cart
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

  // Load discount code from localStorage and validate
  useEffect(() => {
    try { setCode((localStorage.getItem('discount_code') || '').trim()); } catch {}
  }, []);
  useEffect(() => {
    const init = async () => {
      const c = (code || '').trim();
      if (!c) { setValid(false); setPct(0); return; }
      try {
        const res = await fetch(`/api/discount-codes/validate?code=${encodeURIComponent(c)}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.valid) { setValid(true); setPct(Number(json.pct || 0.10)); }
        else { setValid(false); setPct(0); }
      } catch {
        setValid(false); setPct(0);
      }
    };
    init();
  }, [code]);

  // Mobile menu behaviors
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

  // Validations & sanitizers
  const sanitizeFullName = (value) => value.replace(/[^A-Za-z' -]+/g, "");
  const sanitizeCity = (value) => value.replace(/[^A-Za-z ]+/g, "");
  const validTelegram = (v) => /^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(v);

  const onFullNameChange = (v) => {
    const cleaned = sanitizeFullName(v);
    setFullName(cleaned);
    const ok = cleaned.trim() === "" ? true : /^[A-Za-z' -]+$/.test(cleaned.trim());
    setNameErr(ok ? "" : "Only letters, spaces, hyphens (-), and apostrophes (') are allowed");
    try { nameRef.current?.setCustomValidity(ok ? "" : "Only letters, spaces, hyphens (-), and apostrophes (') are allowed"); } catch {}
  };
  const onCityChange = (v) => {
    const cleaned = sanitizeCity(v);
    setCity(cleaned);
    const ok = cleaned.trim() === "" ? true : /^[A-Za-z ]+$/.test(cleaned.trim());
    setCityErr(ok ? "" : "Only letters and spaces are allowed");
    try { cityRef.current?.setCustomValidity(ok ? "" : "Only letters and spaces are allowed"); } catch {}
  };
  const onTelegramChange = (v) => {
    setTelegram(v);
    if (v.trim() === "") {
      setTgErr("");
      try { tgRef.current?.setCustomValidity(""); } catch {}
      return;
    }
    const ok = validTelegram(v.trim());
    setTgErr(ok ? "" : "Username must start with @, begin with a letter, and be 5–32 chars (letters, numbers, underscore)");
    try { tgRef.current?.setCustomValidity(ok ? "" : "Username must start with @, begin with a letter, and be 5–32 chars (letters, numbers, underscore)"); } catch {}
  };

  const subtotal = useMemo(() => (cart || []).reduce((s, it) => s + Number(it.price || 0), 0), [cart]);
  const discAmt = valid ? +(subtotal * pct).toFixed(2) : 0;
  const fees = 0;
  const total = Math.max(0, subtotal - discAmt + fees);

  const [orderDate, setOrderDate] = useState("—");
  useEffect(() => { setOrderDate(new Date().toLocaleString()); }, []);

  const [formValid, setFormValid] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      try {
        setFormValid(Boolean(formRef.current?.checkValidity()));
      } catch { setFormValid(false); }
    }, 0);
  }, [telegram, email, fullName, address, country, region, city, zip, note, addNote]);

  const confirmDisabled = !(cart.length > 0 && formValid);

  const onConfirm = async (e) => {
    e.preventDefault();
    if (confirmDisabled) return;
    const formEl = formRef.current;
    if (formEl && !formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    try {
      const payload = {
        email: (email || '').trim(),
        fullName: fullName || undefined,
        telegram: telegram || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        region: region || undefined,
        zip: zip || undefined,
        note: addNote ? (note || "").trim() : undefined,
        discountCode: valid ? code : undefined,
      };
      const res = await fetch('/api/checkout/nowpayments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      const json = ct.includes('application/json') ? await res.json() : { error: 'Unexpected response', text: await res.text() };
      if (!res.ok) throw new Error(json?.error || 'Payment creation failed');
      if (json?.invoice_url) {
        window.location.href = json.invoice_url;
      } else {
        throw new Error('Missing invoice URL');
      }
    } catch (err) {
      alert((err && err.message) || 'Failed to start payment. Please try again.');
    }
  };

  return (
    <>
      <div className="page-shell checkout-page has-mobile-nav">
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
          <header style={{textAlign:'left', paddingTop:64, marginBottom:48}}>
            <h1><span className="gradient-text">Secure Checkout</span></h1>
            <p style={{color:"var(--muted)", fontSize:15, margin:0}}>You're one step away from boosting your productivity.</p>
          </header>

          <div className="checkout-layout">
            <main className="payment-form">
              <form id="checkoutForm" ref={formRef} onSubmit={(e)=>e.preventDefault()}>
                <div className="form-section">
                  <h2>Contact information</h2>
                  <p className="helper-text">We'll use this Telegram username to send you order details and updates.</p>
                  <div className="form-group" style={{marginTop:10}}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="input"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{marginTop:10}}>
                    <label htmlFor="telegram">Telegram Username</label>
                    <input
                      type="text"
                      id="telegram"
                      name="telegram"
                      className="input"
                      placeholder="@username"
                      required
                      pattern="^@[A-Za-z][A-Za-z0-9_]{4,31}$"
                      title="Must start with @, begin with a letter, and be 5–32 characters using letters, numbers, or underscore"
                      inputMode="text"
                      value={telegram}
                      onChange={(e)=>onTelegramChange(e.target.value)}
                      ref={tgRef}
                    />
                    <p className="helper-text">You are currently checking out as a guest.</p>
                    {tgErr ? <p id="telegramError" className="error-text">{tgErr}</p> : null}
                  </div>
                </div>

                <div className="form-section">
                  <h2>Billing Information</h2>
                  <div className="form-row" style={{marginBottom:12}}>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="input"
                        placeholder="John M. Doe"
                        required
                        pattern="^[A-Za-z' -]+$"
                        title="Only letters, spaces, hyphens (-), and apostrophes (') are allowed"
                        inputMode="text"
                        autoComplete="name"
                        value={fullName}
                        onChange={(e)=>onFullNameChange(e.target.value)}
                        ref={nameRef}
                      />
                      {nameErr ? <p id="fullNameError" className="error-text">{nameErr}</p> : null}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Street Address</label>
                    <input type="text" id="address" name="address" className="input" placeholder="123 Main Street" required value={address} onChange={(e)=>setAddress(e.target.value)} />
                  </div>
                  <div className="form-row" style={{marginBottom:12}}>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="country">Country</label>
                      <select id="country" name="country" className="input" required value={country} onChange={(e)=>setCountry(e.target.value)}>
                        <option value="" disabled>Select your country</option>
                        {[
                          'United States','United Kingdom','Canada','Australia','New Zealand','Ireland','Germany','France','Italy','Spain','Portugal','Netherlands','Belgium','Switzerland','Austria','Sweden','Norway','Denmark','Finland','Poland','Czechia','Romania','Greece','Hungary','Bulgaria','Croatia','Serbia','Turkey','Ukraine','Russia','Brazil','Mexico','Argentina','Chile','Colombia','Peru','Philippines','India','Indonesia','Malaysia','Singapore','Thailand','Vietnam','Japan','South Korea','China','South Africa','Nigeria','Kenya','Egypt','United Arab Emirates'
                        ].map((c)=> <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{flex:1}}>
                      <label htmlFor="region">State/County/Province</label>
                      <input type="text" id="region" name="region" className="input" placeholder="State / County / Province" value={region} onChange={(e)=>setRegion(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="input"
                        placeholder="New York"
                        required
                        pattern="^[A-Za-z ]+$"
                        title="Only letters and spaces are allowed"
                        inputMode="text"
                        autoComplete="address-level2"
                        value={city}
                        onChange={(e)=>onCityChange(e.target.value)}
                        ref={cityRef}
                      />
                      {cityErr ? <p id="cityError" className="error-text">{cityErr}</p> : null}
                    </div>
                    <div className="form-group">
                      <label htmlFor="zip">ZIP Code</label>
                      <input type="text" id="zip" name="zip" className="input" placeholder="10001" required value={zip} onChange={(e)=>setZip(e.target.value)} />
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
                      <input type="checkbox" id="addNoteToggle" checked={addNote} onChange={(e)=>setAddNote(e.target.checked)} style={{width:16,height:16}} /> Add a note to your order
                    </label>
                    {addNote ? (
                      <textarea id="orderNote" className="input" placeholder="Notes about your order." style={{minHeight:90,resize:'vertical'}} value={note} onChange={(e)=>setNote(e.target.value)} />
                    ) : null}
                  </div>
                  <p className="legal-text">By proceeding with your purchase you agree to our <a href="/terms" target="_blank" rel="noopener">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
                </div>
              </form>
            </main>

            <aside className="order-summary">
              <h2>Order Summary</h2>
              <h3 className="items-title">Items (<span id="itemsCount">{cart.length}</span>)</h3>
              <div id="itemsList" className="items-list">
                {cart.map((it, idx) => (
                  <div className="item-row" key={(it.listing_id || it.id || idx)+"-row"}>
                    <div className="name">{it.name || 'Listing'}</div>
                    <div className="price">{format(it.price)}</div>
                  </div>
                ))}
              </div>
              <div className="price-details">
                <div className="price-row"><div className="label">Order Date</div><div id="orderDate" className="value">{orderDate}</div></div>
                <div className="price-row"><div className="label">Subtotal</div><div id="subtotalVal" className="value">{format(subtotal)}</div></div>
                <div className="price-row" style={{display: discAmt > 0 ? '' : 'none'}}><div className="label">Discount</div><div className="value">-{format(discAmt)}</div></div>
                <div className="price-row"><div className="label">Taxes & Fees</div><div id="feesVal" className="value">{format(fees)}</div></div>
                <div className="price-row total"><div className="label">Total</div><div id="totalVal" className="value">{format(total)}</div></div>
              </div>
              <a href="/cart" id="backToCart" className="btn-secondary">Return to cart</a>
              <button id="confirmPay" className="btn-primary" type="button" onClick={onConfirm} aria-disabled={confirmDisabled ? "true" : undefined} disabled={confirmDisabled} style={{marginTop:8}}>Confirm and Pay</button>
              <div className="secure-info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a9 9 0 0 0-9 9 9 9 0 0 0 9 9 9 9 0 0 0 9-9A9 9 0 0 0 12 1zm0 16a7 7 0 0 1-7-7 7 7 0 0 1 7-7 7 7 0 0 1 7 7 7 7 0 0 1-7 7z"/><path d="M12 7a1 1 0 0 0-1 1v4a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1zm0 8a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>
                <span>Payments are secure and encrypted.</span>
              </div>
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
