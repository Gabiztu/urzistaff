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

  return (
    <main style={{padding:24, display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h1>Admin Dashboard</h1>
        <div style={{display:'flex', gap:8}}>
          <button onClick={()=>{ setEditing(null); setShowForm(true); }} style={{padding:'8px 12px', borderRadius:8, background:'#2b2a33', color:'#e5e7eb', border:'1px solid #2b2a33'}}>New listing</button>
          <button onClick={signOut} style={{padding:'8px 12px', borderRadius:8, background:'#7f5af0', color:'#fff', border:'1px solid #7f5af0'}}>Sign out</button>
        </div>
      </div>
      {showForm && (
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
      )}
      <section style={{display:'grid', gap:8}}>
        <h2 style={{margin:'8px 0'}}>Listings</h2>
        {loadingRows ? (
          <p>Loading listings…</p>
        ) : rows.length === 0 ? (
          <p>No listings yet.</p>
        ) : (
          <div style={{overflowX:'auto', border:'1px solid #2b2a33', borderRadius:10}}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#0f0f14'}}>
                  <th style={th}>Name</th>
                  <th style={th}>Rate</th>
                  <th style={th}>Active</th>
                  <th style={th}>Created</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{borderTop:'1px solid #2b2a33'}}>
                    <td style={td}>{r.name}</td>
                    <td style={td}>${Number(r.hourly_rate).toFixed(2)}/hr</td>
                    <td style={td}>{r.is_active ? 'Yes' : 'No'}</td>
                    <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                    <td style={td}><button onClick={()=>{ setEditing(r); setShowForm(true); }} style={{padding:'6px 10px', borderRadius:8, background:'#2b2a33', color:'#e5e7eb', border:'1px solid #2b2a33'}}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const th = { textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#e5e7eb', borderBottom:'1px solid #2b2a33' };
const td = { padding:'10px 12px', color:'#cbd5e1' };
