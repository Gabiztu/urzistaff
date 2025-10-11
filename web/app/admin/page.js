"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ListingForm from "./components/ListingForm";
import LoadingScreen from "@/app/components/LoadingScreen";

export default function AdminHome() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [codes, setCodes] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [loadingCodes, setLoadingCodes] = useState(false);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [q, setQ] = useState("");

  const fetchPage = async (pageNumber = 1, query = q) => {
    setLoadingRows(true);
    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let qb = supabase
      .from("listings")
      .select("id,name,hourly_rate,is_active,created_at", { count: "exact" })
      .order("created_at", { ascending: false });
    if (query && query.trim()) qb = qb.ilike("name", `%${query.trim()}%`);
    const { data, count, error } = await qb.range(from, to);
    if (error) {
      setError(error.message || String(error));
      setRows([]);
      setTotalCount(0);
    } else {
      setRows(data || []);
      setTotalCount(count || 0);
    }
    setLoadingRows(false);
  };

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
      await fetchPage(1);
      await loadCodes();
    };
    check();
  }, [router]);

  const loadCodes = async () => {
    try {
      setLoadingCodes(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin/discount-codes', { headers: { 'x-admin-email': session.user.email }, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load codes');
      setCodes(Array.isArray(json?.codes) ? json.codes : []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoadingCodes(false);
    }
  };

  const addCode = async () => {
    const raw = (codeInput || '').trim();
    if (!raw) return;
    const code = raw.toUpperCase();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': session.user.email },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add code');
      setCodeInput('');
      await loadCodes();
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const deleteCode = async (code) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/discount-codes?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': session.user.email },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete code');
      await loadCodes();
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!ready) { return <LoadingScreen label="Loading admin" />; }

  const total = totalCount;
  const active = rows.filter(r => r.is_active).length;
  const inactive = total - active;

  return (
    <main>
      <style dangerouslySetInnerHTML={{__html: `
        /* Use global theme variables defined in globals.css (light/dark) */
        :root { --pill:999px; --radius:14px; --shadow:0 10px 30px rgba(0,0,0,.12); --ease:cubic-bezier(.22,1,.36,1); }
        .wrap { max-width: 1100px; margin: 0 auto; padding: 24px; padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px) + 90px); }
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
        @media (max-width: 900px) {
          .stat-grid { grid-template-columns: 1fr 1fr }
        }
        /* Mobile-first enhancements without changing desktop */
        @media (max-width: 768px) {
          .wrap { padding: 16px; }
          .topbar { flex-wrap: wrap; align-items: flex-start; gap: 8px; }
          .brand h1 { font-size: 18px; }
          .actions { width: 100%; justify-content: flex-start; }
          .actions .btn { flex: 1 1 auto; min-width: 0; }
          .stat-grid { grid-template-columns: 1fr; }
          .section-head { flex-wrap: wrap; gap: 8px; }
          .search { width: 100%; }
          .search input { width: 100%; }
          /* Table: make it easier to view on phones */
          .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 -8px; padding: 0 8px; }
          th, td { padding: 10px; }
          /* Hide Created column to save space */
          thead th:nth-child(4), tbody td:nth-child(4) { display: none; }
        }
        @media (max-width: 420px) {
          .actions .btn { padding: 8px 10px; }
          th, td { padding: 8px; }
        }
      `}} />

      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logo" />
            <h1>Urzistaff Admin</h1>
          </div>
          <div className="actions">
            <a className="btn" href="/admin/clients">Clients</a>
            <button className="btn" onClick={()=>{ setEditing(null); setShowForm(true); }}>New Listing</button>
            <button className="btn btn-primary" onClick={signOut}>Sign out</button>
          </div>
        </div>

        {error && <p className="muted" style={{marginTop:-8}}>{error}</p>}

        <div className="grid">
          <section className="card">
            <div className="section-head" style={{marginBottom:12}}>
              <h2 style={{margin:0}}>Discount Codes</h2>
              <span className="muted">Fixed 10% off. No expiry.</span>
            </div>
            <div style={{display:'flex', gap:8, marginBottom:12}}>
              <input value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="NEWCODE10" style={{ padding:'10px 12px', border:'1px solid var(--border)', borderRadius:10, background:'var(--elev)', color:'var(--text)' }} />
              <button className="btn" onClick={addCode}>Add</button>
              <button className="btn" onClick={loadCodes} disabled={loadingCodes}>Refresh</button>
            </div>
            {loadingCodes ? (
              <LoadingScreen full={false} label="Loading discount codes" />
            ) : codes.length === 0 ? (
              <p className="muted">No codes.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map(c => (
                      <tr key={c.code}>
                        <td>{c.code}</td>
                        <td>{Math.round((Number(c.discount_pct ?? 0.10))*100)}%</td>
                        <td className="muted">{c.created_at ? new Date(c.created_at).toLocaleString() : '—'}</td>
                        <td><button className="btn" onClick={()=>deleteCode(c.code)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

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
                onSaved={async ()=>{ setShowForm(false); setEditing(null); await fetchPage(page); }}
              />
            </div>
          )}

          <section className="card">
            <div className="section-head">
              <h2 style={{margin:0}}>Listings</h2>
              <div className="search">
                <input
                  placeholder="Search by name..."
                  value={q}
                  onChange={async (e) => {
                    const v = e.target.value;
                    setQ(v);
                    setPage(1);
                    await fetchPage(1, v);
                  }}
                />
              </div>
            </div>

            {loadingRows ? (
              <LoadingScreen full={false} label="Loading listings" />
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
            {!loadingRows && total > 0 && (
              <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,marginBottom:12}}>
                <span className="muted">
                  Showing {Math.min((page-1)*PAGE_SIZE+1, total)}–{Math.min(page*PAGE_SIZE, total)} of {total}
                </span>
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
                  return (
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn" disabled={page<=1} onClick={async()=>{ const p = page-1; setPage(p); await fetchPage(p); }}>Prev</button>
                      <span className="muted">Page {page} of {totalPages}</span>
                      <button className="btn" disabled={page>=totalPages} onClick={async()=>{ const p = page+1; setPage(p); await fetchPage(p); }}>Next</button>
                    </div>
                  );
                })()}
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
