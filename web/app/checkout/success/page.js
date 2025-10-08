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
    <main style={{padding:24}}>
      <h1>Payment successful</h1>
      {status === 'clearing' && (
        <p style={{marginTop:8, color: 'var(--muted)'}}>Finalizing your order… clearing the cart.</p>
      )}
      {status === 'cleared' && (
        <p style={{marginTop:8, color: 'var(--muted)'}}>Your cart has been cleared.</p>
      )}
      {status === 'error' && (
        <p style={{marginTop:8, color: '#ef4444'}}>We could not clear the cart automatically. You can continue shopping and it will update on next action. {error && `(${error})`}</p>
      )}
      <p style={{marginTop:12}}>
        <a href="/shop" style={{color:'#7f5af0', textDecoration:'none'}}>Continue shopping</a>
      </p>
    </main>
  );
}
