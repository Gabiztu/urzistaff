"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ListingForm from "./components/ListingForm";

export default function AdminHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").single();
      if (profile?.role !== "admin") {
        setError("Not an admin. Redirecting...");
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      setReady(true);
      // Load listings (read-only)
      const { data } = await supabase
        .from("listings")
        .select("id,name,hourly_rate,is_active,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      setRows(data || []);
      setLoadingRows(false);
    };
    check();
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!ready) {
    return <main style={{padding:24}}><p>Loading admin...</p>{error && <p style={{color:'#f88'}}>{error}</p>}</main>;
  }

  const total = rows.length;
  const active = rows.filter(r => r.is_active).length;
  const inactive = total - active;

  return (
    <main>
      <style dangerouslySetInnerHTML={{__html: `
        /* Use global theme variables defined in globals.css (light/dark) */
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
        .grid { display:grid; grid-template-columns: 1fr; gap: 16px; }
        .stat-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { background: var(--surface); border:1px solid var(--border); border-radius: var(--radius); padding: 16px; }
        .stat { display:flex; flex-direction:column; gap:6px; }
        .stat .label { color: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: .02em }
        .stat .value { font-size: 22px; font-weight: 800; font-family: "Space Grotesk", sans-serif }
        .section-head { display:flex; align-items:center; justify-content:space-between; }
        .search { display:flex; gap:8px; }
        .search input { padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--elev); color:var(--text) }
        .table-wrap { overflow:auto; border:1px solid var(--border); border-radius: 12px; }
        table { width:100%; border-collapse: collapse; }
        thead tr { background: var(--elev); }
        th, td { text-align:left; padding:12px; }
        th { color: var(--text); font-weight: 700; border-bottom: 1px solid var(--border); }
        tbody tr { border-top: 1px solid var(--border); transition: background .15s var(--ease); }
        tbody tr:hover { background: color-mix(in oklab, var(--surface), var(--text) 6%); }
        .badge { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius: var(--pill); font-size: 12px; font-weight: 700; }
        .badge.ok { background:#10B9811A; color:#10B981; border:1px solid #0f5; }
        .badge.muted { background: color-mix(in oklab, var(--surface), var(--text) 8%); color: var(--muted); border: 1px solid var(--border) }
        .muted { color: var(--muted) }
        @media (max-width: 900px) { .stat-grid { grid-template-columns: 1fr 1fr } }
      `}} />

      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logo" />
            <h1>Urzistaff Admin</h1>
          </div>
          <div className="actions">
            <button className="btn" onClick={()=>{ setEditing(null); setShowForm(true); }}>New Listing</button>
            <button className="btn btn-primary" onClick={signOut}>Sign out</button>
          </div>
        </div>

        {error && <p className="muted" style={{marginTop:-8}}>{error}</p>}

        <div className="grid">
          <div className="stat-grid">
            <div className="card stat"><span className="label">Total Listings</span><span className="value">{total}</span></div>
            <div className="card stat"><span className="label">Active</span><span className="value">{active}</span></div>
            <div className="card stat"><span className="label">Inactive</span><span className="value">{inactive}</span></div>
          </div>

          {showForm && (
            <div className="card">
              <ListingForm
                initial={editing}
                onCancel={()=>{ setShowForm(false); setEditing(null); }}
                onSaved={async ()=>{
                  setShowForm(false); setEditing(null);
                  const { data } = await supabase
                    .from("listings")
                    .select("id,name,hourly_rate,is_active,created_at")
                    .order("created_at", { ascending: false })
                    .limit(50);
                  setRows(data || []);
                }}
              />
            </div>
          )}

          <section className="card">
            <div className="section-head">
              <h2 style={{margin:0}}>Listings</h2>
              <div className="search">
                <input placeholder="Search by name..." onChange={(e)=>{
                  const q = e.target.value.toLowerCase();
                  setRows((prev)=>{
                    // naive client-side filter just for display; refetch is out of scope
                    if (!Array.isArray(prev) || !prev.__orig) {
                      const orig = Array.isArray(prev) ? prev.slice() : [];
                      Object.defineProperty(orig, "__orig", { value: orig, enumerable: false });
                      return orig.filter(r=>r.name?.toLowerCase().includes(q));
                    }
                    return prev.__orig.filter(r=>r.name?.toLowerCase().includes(q));
                  });
                }} />
              </div>
            </div>

            {loadingRows ? (
              <p className="muted" style={{marginTop:8}}>Loading listings…</p>
            ) : rows.length === 0 ? (
              <p className="muted" style={{marginTop:8}}>No listings yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td>${Number(r.hourly_rate ?? 0).toFixed(2)}/hr</td>
                        <td>{r.is_active ? <span className="badge ok">Active</span> : <span className="badge muted">Inactive</span>}</td>
                        <td className="muted">{new Date(r.created_at).toLocaleString()}</td>
                        <td>
                          <button className="btn" onClick={()=>{ setEditing(r); setShowForm(true); }}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const th = { textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#e5e7eb', borderBottom:'1px solid #2b2a33' };
const td = { padding:'10px 12px', color:'#cbd5e1' };
