"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./styles.module.css";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
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
        {error && <p className={styles.error}>{error}</p>}
        <button disabled={loading} type="submit">{loading? "Signing in..." : "Sign in"}</button>
      </form>
    </div>
  );
}
