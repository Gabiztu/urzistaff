"use client";

import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function ClientSupport() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Header cart count: hydrate from localStorage, then sync from API
  useEffect(() => {
    try {
      const n = parseInt(localStorage.getItem("cart_count") || "0", 10) || 0;
      setCartCount(n);
    } catch {}

    const load = async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const json = await res.json();
        const n = Array.isArray(json?.cart?.items) ? json.cart.items.length : 0;
        setCartCount(n);
        try { localStorage.setItem("cart_count", String(n)); } catch {}
      } catch {}
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
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    document.addEventListener("click", onDoc);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onDoc);
      window.removeEventListener("resize", onResize);
    };
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
            <a href="/shop">Shop</a>
            <a href="/faq">FAQ</a>
            <a href="/support" className="active">Support</a>
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
          <a href="/support" className="active" onClick={() => setMobileOpen(false)}>Support</a>
        </nav>
      </header>

      <section className="hero container">
        <h1><span className="gradient-text">We're here to help</span></h1>
        <p>Reach us on Telegram for 1:1 support, or join our channel for announcements, updates, and tips.</p>
      </section>

      <main className="container" style={{ flex: 1 }}>
        <div className="grid">
          <div className="card">
            <h2>Chat with Support</h2>
            <p>Direct message our support on Telegram for help with orders, billing, or questions.</p>
            <div className="actions">
              <a className="btn-primary" href="tg://resolve?domain=raegency">Open in Telegram app</a>
              <a className="btn-secondary" href="https://t.me/raegency" target="_blank" rel="noopener">Open in Browser</a>
            </div>
          </div>
          <div className="card">
            <h2>Join the Telegram Channel</h2>
            <p>Get product news, release notes, and best practices directly from the team.</p>
            <div className="actions">
              <a className="btn-primary" href="tg://resolve?domain=urzistaff">Open in Telegram app</a>
              <a className="btn-secondary" href="https://t.me/urzistaff" target="_blank" rel="noopener">Open in Browser</a>
            </div>
          </div>
        </div>
      </main>

      <ThemeToggle />

      {/* Page-specific styles to match original support.html */}
      <style jsx>{`
        .hero{padding:64px 0 32px;text-align:center}
        .hero h1{font-size:clamp(2rem,4vw,2.5rem);margin:0 0 12px}
        .hero p{color:var(--muted);max-width:700px;margin:0 auto}

        .grid{display:grid;grid-template-columns:1fr;gap:20px;margin:32px auto;max-width:900px}
        @media(min-width:900px){.grid{grid-template-columns:1fr 1fr}}

        .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px;display:flex;flex-direction:column;gap:14px;min-height:220px}
        .card h2{font-size:clamp(20px,2.2vw,24px);margin:0}
        .card p{color:var(--muted);margin:0;font-size:clamp(14px,1.5vw,16px)}

        .actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}

        .btn-primary{display:inline-block;text-align:center;background:var(--primary);border:1px solid var(--primary);color:#fff;border-radius:10px;font-weight:600;padding:14px 22px;cursor:pointer;transition:transform .2s var(--ease-out);font-size:var(--text-md)}
        .btn-primary:hover{transform:scale(1.03);text-decoration:none}

        .btn-secondary{display:inline-block;text-align:center;background:transparent;border:1px solid var(--border);color:var(--text);border-radius:10px;font-weight:600;padding:14px 22px;cursor:pointer;transition:transform .2s var(--ease-out);font-size:var(--text-md)}
        .btn-secondary:hover{transform:translateY(-1px);text-decoration:none}

        /* Mobile nav (page local) */
        .menu-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 10px;margin-left:auto;margin-right:10px}
        @media(min-width:768px){.menu-btn{display:none}}
        .mobile-nav{display:none;position:absolute;top:100%;left:12px;right:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;box-shadow:var(--shadow)}
        .mobile-nav a{display:block;padding:10px 12px;color:var(--text);border-radius:8px;text-align:center;text-decoration:none}
        .mobile-nav a:hover,.mobile-nav a.active{background:var(--elev)}
        .mobile-nav.open{display:flex;flex-direction:column;gap:6px}
        .nav-container{position:relative}
      `}</style>
    </>
  );
}

