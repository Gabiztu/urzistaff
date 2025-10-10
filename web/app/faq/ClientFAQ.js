"use client";

import { useEffect, useRef, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

export default function ClientFAQ() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(() => new Set([0, 1])); // first two open by default
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const toggleQA = (idx) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

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
      <div className="page-shell">
        <header className="site-header">
          <div className="container nav-container">
            <a href="/" className="nav-brand" aria-label="UrziStaff home">
              <span className="nav-brand-text">UrziStaff</span>
            </a>
            <nav className="nav-links">
              <a href="/">Home</a>
              <a href="/shop">Shop</a>
              <a href="/faq" className="active">FAQ</a>
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
            <a href="/faq" className="active" onClick={() => setMobileOpen(false)}>FAQ</a>
            <a href="/support" onClick={() => setMobileOpen(false)}>Support</a>
          </nav>
        </header>

        <section className="hero container">
          <h1><span className="gradient-text">Frequently Asked Questions</span></h1>
          <p>We connect clients with quality, pre-vetted virtual assistants. Here are quick answers about how it works.</p>
        </section>

        <main className="container" style={{ flex: 1 }}>
          <section className="faq" aria-label="FAQ list">
            <article className={"qa" + (open.has(0) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(0) ? "true" : "false"} onClick={() => toggleQA(0)}>
                <h3>What is Urzistaff?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>Urzistaff is an agency that connects clients with high‑quality, qualified virtual assistants (VAs). We curate talent, streamline matching, and support you end‑to‑end so you never lose time or money.</p>
              </div>
            </article>

            <article className={"qa" + (open.has(1) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(1) ? "true" : "false"} onClick={() => toggleQA(1)}>
                <h3>Guarantee Policy</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p className="badge">Middleman accepted: <strong>@marshal</strong></p>
                <div className="policy-box">
                  <ul>
                    <li>If the hired VA does not respond within 72 hours, you may select a replacement.</li>
                    <li>If the hired VA becomes unavailable within the first two weeks after hiring, you may select a replacement.</li>
                    <li>The replacement may be one VA of equal value or multiple VAs whose combined value matches the original.</li>
                    <li>This policy ensures you do not lose time or money.</li>
                  </ul>
                </div>
              </div>
            </article>

            <article className={"qa" + (open.has(2) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(2) ? "true" : "false"} onClick={() => toggleQA(2)}>
                <h3>How does the hiring process work?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
                  <li>Browse our <a href="/shop">Shop</a> and add assistants to your cart.</li>
                  <li>Checkout securely, leaving your Telegram so we can coordinate.</li>
                  <li>We introduce you and ensure a smooth start. If anything goes wrong, our Guarantee Policy applies.</li>
                </ol>
              </div>
            </article>

            <article className={"qa" + (open.has(3) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(3) ? "true" : "false"} onClick={() => toggleQA(3)}>
                <h3>What does the $99 price cover?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>The $99 fee is a one‑time listing/connection fee per assistant selection. It covers vetting, matching, and onboarding support.</p>
              </div>
            </article>

            <article className={"qa" + (open.has(4) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(4) ? "true" : "false"} onClick={() => toggleQA(4)}>
                <h3>Which payments do you accept?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>We process payments via <strong>NOWPayments</strong>. If you need middleman escrow, we accept <strong>@marshal</strong>.</p>
              </div>
            </article>

            <article className={"qa" + (open.has(5) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(5) ? "true" : "false"} onClick={() => toggleQA(5)}>
                <h3>How fast will the VA respond?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>Typically within 24–48 hours. If there’s no response within 72 hours, our Guarantee Policy lets you choose a replacement.</p>
              </div>
            </article>

            <article className={"qa" + (open.has(6) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(6) ? "true" : "false"} onClick={() => toggleQA(6)}>
                <h3>Can I replace my VA later?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>Yes. If your VA becomes unavailable within two weeks of hiring, you can select another VA of the same value (or multiple VAs matching the original value).</p>
              </div>
            </article>

            <article className={"qa" + (open.has(7) ? " open" : "") }>
              <div className="q" role="button" tabIndex={0} aria-expanded={open.has(7) ? "true" : "false"} onClick={() => toggleQA(7)}>
                <h3>How do I get support?</h3>
                <div className="toggle">+</div>
              </div>
              <div className="a">
                <p>Visit our <a href="/support">Support</a> page to chat on Telegram or join our channel for updates.</p>
              </div>
            </article>
          </section>
        </main>

        <div className="footer-push">
          <ThemeToggle />
        </div>
      </div>

      <style jsx>{`
        .page-shell{min-height:100vh;display:flex;flex-direction:column;align-items:stretch}
        .page-shell>*{width:100%}

        .hero{padding:64px 0 24px;text-align:center}
        .hero h1{font-size:clamp(2rem,4vw,2.5rem);margin:0 0 12px}
        .hero p{color:var(--muted);max-width:720px;margin:0 auto}

        .faq{margin:24px auto 64px;display:flex;flex-direction:column;gap:12px;max-width:900px}
        .qa{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);overflow:hidden}
        .q{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px;cursor:pointer}
        .q h3{margin:0;font-size:18px}
        .toggle{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:2px solid var(--border);color:var(--muted);transition:all .2s var(--ease-out)}
        .qa.open .toggle{border-color:var(--primary);background:var(--primary);color:#fff}
        .a{display:none;padding:0 18px 18px;color:var(--muted);line-height:1.7}
        .qa.open .a{display:block}

        ul{margin:8px 0 0 18px}
        li{margin:6px 0}
        .policy-box{background:var(--elev);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-top:8px}
        .badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:var(--pill);font-size:12px;border:1px solid var(--border);color:var(--muted);background:var(--surface)}

        .menu-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:10px;padding:8px 10px;margin-left:auto;margin-right:10px}
        @media(min-width:768px){.menu-btn{display:none}}
        .mobile-nav{display:none;position:absolute;top:100%;left:12px;right:12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;box-shadow:var(--shadow)}
        .mobile-nav a{display:block;padding:10px 12px;color:var(--text);border-radius:8px;text-align:center;text-decoration:none}
        .mobile-nav a:hover,.mobile-nav a.active{background:var(--elev)}
        .mobile-nav.open{display:flex;flex-direction:column;gap:6px}
        .nav-container{position:relative}
        .footer-push{margin-top:auto}
      `}</style>
    </>
  );
}
