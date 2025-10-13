"use client";
import { useEffect, useState } from "react";

export default function SuccessPage(){
  const [status, setStatus] = useState("clearing");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const clear = async () => {
      try {
        const res = await fetch('/api/cart/clear', { method: 'POST', cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to clear cart');
        try { localStorage.setItem('cart_count', '0'); } catch {}
        if (!cancelled) setStatus('cleared');
      } catch (e) {
        if (!cancelled) { setStatus('error'); setError(e.message || String(e)); }
      }
    };
    clear();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="ck-wrap">
      <style>{`
        .ck-wrap{min-height:calc(100vh - 64px);display:grid;place-items:center;padding:24px}
        .ck-card{max-width:560px;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:var(--shadow);text-align:center}
        .ck-icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;color:white;
          background: radial-gradient(120% 120% at 0% 0%, color-mix(in oklab, var(--primary), #000 0%), color-mix(in oklab, var(--primary), #fff 10%))}
        .ck-title{font-family:"Space Grotesk",sans-serif;font-size:clamp(1.6rem,4vw,2rem);margin:8px 0 6px}
        .ck-text{color:var(--muted);margin:0}
        .ck-status{margin-top:8px;font-size:14px}
        .ck-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px}
        .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;border:1px solid var(--border);background:var(--elev);color:var(--text);text-decoration:none;font-weight:600}
        .btn-primary{background:var(--primary);border-color:var(--primary);color:#fff}
        .btn-ghost{background:transparent}
      `}</style>

      <div className="ck-card">
        <div className="ck-icon" aria-hidden>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h1 className="ck-title">Payment successful</h1>
        <p className="ck-text">Thank you! Your payment was received. A confirmation will be sent shortly.</p>
        <p className="ck-text" style={{marginTop:6,fontStyle:'italic'}}>If you can't find our email in your Inbox, please check your Spam/Junk folder.</p>
        <div className="ck-status">
          {status === 'clearing' && (<span style={{color:'var(--muted)'}}>Finalizing your order… clearing the cart.</span>)}
          {status === 'cleared' && (<span style={{color:'var(--muted)'}}>Your cart has been cleared.</span>)}
          {status === 'error' && (<span style={{color:'#ef4444'}}>Could not clear the cart automatically. {error && `(${error})`}</span>)}
        </div>
        <div className="ck-actions">
          <a className="btn btn-primary" href="/shop">Browse assistants</a>
          <a className="btn btn-ghost" href="/">Go to Home</a>
        </div>
      </div>
    </main>
  );
}
