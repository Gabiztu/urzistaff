export default function CancelPage(){
  return (
    <main className="ck-wrap">
      <style>{`
        .ck-wrap{min-height:calc(100vh - 64px);display:grid;place-items:center;padding:24px}
        .ck-card{max-width:560px;width:100%;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;box-shadow:var(--shadow);text-align:center}
        .ck-icon{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto 12px;color:white;
          background: radial-gradient(120% 120% at 0% 0%, color-mix(in oklab, #ef4444, #000 0%), color-mix(in oklab, #ef4444, #fff 10%))}
        .ck-title{font-family:"Space Grotesk",sans-serif;font-size:clamp(1.6rem,4vw,2rem);margin:8px 0 6px}
        .ck-text{color:var(--muted);margin:0}
        .ck-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:18px}
        .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border-radius:10px;border:1px solid var(--border);background:var(--elev);color:var(--text);text-decoration:none;font-weight:600}
        .btn-primary{background:var(--primary);border-color:var(--primary);color:#fff}
        .btn-ghost{background:transparent}
      `}</style>

      <div className="ck-card">
        <div className="ck-icon" aria-hidden>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </div>
        <h1 className="ck-title">Payment canceled</h1>
        <p className="ck-text">Your payment was canceled or failed. You can try again or review your cart.</p>
        <div className="ck-actions">
          <a className="btn btn-primary" href="/checkout">Try again</a>
          <a className="btn btn-ghost" href="/cart">Back to cart</a>
        </div>
      </div>
    </main>
  );
}
