"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminClients() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/admin/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").single();
      if (profile?.role !== "admin") {
        setError("Not an admin. Redirecting...");
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      setReady(true);
      try {
        const res = await fetch('/api/admin/orders', { headers: { 'x-admin-email': session.user.email }, cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load orders');
        setRows(Array.isArray(json?.orders) ? json.orders : []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!ready) {
    return <main style={{padding:24}}><p>Loading admin…</p>{error && <p style={{color:'#f88'}}>{error}</p>}</main>;
  }

  return (
    <main>
      <style dangerouslySetInnerHTML={{__html: `
        :root { --pill:999px; --radius:14px; --shadow:0 10px 30px rgba(0,0,0,.12); --ease:cubic-bezier(.22,1,.36,1); }
        .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; }
        .topbar { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 16px; }
        .brand { display:flex; align-items:center; gap:10px; font-family: "Space Grotesk", sans-serif; }
        .logo { width:28px; height:28px; border-radius:8px; background: var(--primary); }
        h1 { margin:0; font-size: 22px; }
        .actions { display:flex; gap:8px; }
        .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius: 10px; border:1px solid var(--border); background: var(--surface); color: var(--text); cursor:pointer; transition: transform .15s var(--ease), box-shadow .15s var(--ease), border-color .15s var(--ease); }
        .btn:hover { transform: translateY(-1px); box-shadow: var(--shadow); border-color:#444; }
        .btn-primary { background: var(--primary); border-color: var(--primary); color: #fff; }
        .card { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius); padding: 16px; }
        .table-wrap { overflow:auto; border:1px solid var(--border); border-radius: 12px; }
        table { width:100%; border-collapse: collapse; }
        thead tr { background: var(--elev); }
        th, td { text-align:left; padding:12px; }
        th { color: var(--text); font-weight: 700; border-bottom: 1px solid var(--border); white-space: nowrap; }
        tbody tr { border-top: 1px solid var(--border); transition: background .15s var(--ease); }
        tbody tr:hover { background: color-mix(in oklab, var(--surface), var(--text) 6%); }
        .muted { color: var(--muted) }
        @media (max-width: 900px) {
          .wrap { padding: 16px; }
          th, td { padding: 10px; }
          /* Hide region and zip on small screens */
          thead th:nth-child(6), tbody td:nth-child(6),
          thead th:nth-child(7), tbody td:nth-child(7) { display: none; }
        }
      `}} />

      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logo" />
            <h1>Clients</h1>
          </div>
          <div className="actions">
            <a className="btn" href="/admin">← Back</a>
            <button className="btn btn-primary" onClick={signOut}>Sign out</button>
          </div>
        </div>

        {error && <p className="muted" style={{marginTop:-8}}>{error}</p>}

        <section className="card">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="muted">No orders found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Telegram</th>
                    <th>Purchased At</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>City</th>
                    <th>Region</th>
                    <th>ZIP</th>
                    <th>Country</th>
                    <th>Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const list = Array.isArray(r.items) ? r.items : [];
                    const listingNames = list.map(i => i?.name || i?.listing_id || '').filter(Boolean).join(', ');
                    const purchased = r.paid_at ? new Date(r.paid_at).toLocaleString() : '—';
                    return (
                      <tr key={r.id}>
                        <td>{r.telegram || '—'}</td>
                        <td>{purchased}</td>
                        <td>{r.full_name || '—'}</td>
                        <td>{r.address || '—'}</td>
                        <td>{r.city || '—'}</td>
                        <td>{r.region || '—'}</td>
                        <td>{r.zip || '—'}</td>
                        <td>{r.country || '—'}</td>
                        <td style={{minWidth:220}}>{listingNames || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
