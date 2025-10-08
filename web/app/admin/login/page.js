"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Precheck with server (rate-limit, allowlist, MFA)
    try {
      const pre = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage:'precheck', email, totpCode }) });
      if (!pre.ok) throw new Error('Invalid credentials');
    } catch {
      setError('Invalid credentials');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Invalid credentials');
      try { await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage:'report', email, success:false }) }); } catch {}
      setLoading(false);
      return;
    }
    // Basic role check via RPC after login
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .single();
    if (profile?.role !== "admin") {
      setError("You are not an admin.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }
    try { await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ stage:'report', email, success:true }) }); } catch {}
    router.push("/admin");
  };

  return (
    <div className={styles.wrap}>
      <form onSubmit={onSubmit} className={styles.card}>
        <h1>Admin Login</h1>
        <label>Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <label>Authenticator code</label>
        <input type="text" inputMode="numeric" pattern="^[0-9]{6}$" placeholder="6-digit code" value={totpCode} onChange={(e)=>setTotpCode(e.target.value)} required />
        {error && <p className={styles.error}>{error}</p>}
        <button disabled={loading} type="submit">{loading? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
