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
      <div className="page-shell support-page has-mobile-nav">
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
        <h1><span className="gradient-text">We&apos;re here to help</span></h1>
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

      <div className="footer-push">
        <ThemeToggle />
      </div>

      </div>

    </>
  );
}

