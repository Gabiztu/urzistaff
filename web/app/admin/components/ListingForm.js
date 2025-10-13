"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ListingForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    name: "",
    headline: "",
    description: "",
    categories: [], // Change to array for easier management
    languages: [], // Keep as array for easier management
    skills: "",
    age_range: "",
    sex: "",
    devices: [], // Change to array for easier management
    availability: "",
    location: "",
    hourly_rate: 0,
    purchase_price: 99,
    is_active: true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!initial) return;
      // If we only have a partial row, fetch full details by id
      if (initial?.id) {
        const { data, error } = await supabase
          .from('listings')
          .select('id,name,headline,description,categories,languages,skills,age_range,sex,devices,availability,location,hourly_rate,purchase_price,is_active')
          .eq('id', initial.id)
          .single();
        const src = data || initial;
        if (!cancelled) {
          setForm({
            name: src.name || "",
            headline: src.headline || "",
            description: src.description || "",
            categories: src.categories || [],
            languages: src.languages || [],
            skills: Array.isArray(src.skills) ? src.skills.join(", ") : (src.skills || ""),
            age_range: src.age_range || "",
            sex: src.sex || "",
            devices: src.devices || [],
            availability: src.availability || "",
            location: src.location || "",
            hourly_rate: Number(src.hourly_rate || 0),
            purchase_price: Number(src.purchase_price || 99),
            is_active: Boolean(src.is_active ?? true),
          });
        }
      } else {
        if (!cancelled) {
          setForm((f)=>({ ...f }));
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [initial?.id]);

  const toArray = (s) =>
    String(s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    // Get the first category from the categories list for the category field
    const firstCategory = form.categories.length > 0 ? form.categories[0] : null;
    
    const payload = {
      name: form.name,
      headline: form.headline,
      description: form.description,
      category: firstCategory, // Provide a value for the category field to satisfy the NOT NULL constraint
      categories: form.categories, // Send as array directly
      languages: form.languages, // Send as array directly
      skills: toArray(form.skills),
      age_range: form.age_range || null,
      sex: form.sex || null,
      devices: form.devices, // Send as array directly
      availability: form.availability || null,
      location: form.location || null,
      hourly_rate: Number(form.hourly_rate || 0),
      purchase_price: Number(form.purchase_price || 99),
      is_active: !!form.is_active,
    };
    try {
      if (initial?.id) {
        const { error } = await supabase
          .from("listings")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("listings").insert(payload);
        if (error) throw error;
      }
      onSaved?.();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!initial?.id) return;
    if (!confirm("Delete this listing?")) return;
    setSaving(true);
    setError("");
    try {
      const { error } = await supabase.from("listings").delete().eq("id", initial.id);
      if (error) throw error;
      onSaved?.();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  
  // Handle language selection
  const toggleLanguage = (language) => {
    setForm(prevForm => {
      const currentLanguages = [...prevForm.languages];
      const index = currentLanguages.indexOf(language);
      
      if (index >= 0) {
        // Remove language if already selected
        currentLanguages.splice(index, 1);
      } else {
        // Add language if not selected
        currentLanguages.push(language);
      }
      
      return { ...prevForm, languages: currentLanguages };
      });
  };
  
  // Handle category selection
  const toggleCategory = (category) => {
    setForm(prevForm => {
      const currentCategories = [...prevForm.categories];
      const index = currentCategories.indexOf(category);
      
      if (index >= 0) {
        // Remove category if already selected
        currentCategories.splice(index, 1);
      } else {
        // Add category if not selected
        currentCategories.push(category);
      }
      
      return { ...prevForm, categories: currentCategories };
    });
  };
  
  // Handle device selection
  const toggleDevice = (device) => {
    setForm(prevForm => {
      const currentDevices = [...prevForm.devices];
      const index = currentDevices.indexOf(device);
      
      if (index >= 0) {
        // Remove device if already selected
        currentDevices.splice(index, 1);
      } else {
        // Add device if not selected
        currentDevices.push(device);
      }
      
      return { ...prevForm, devices: currentDevices };
    });
  };

  return (
    <form onSubmit={onSubmit} style={card} className="lf-card">
      <style dangerouslySetInnerHTML={{__html: `
        .lf-card { position: relative; overflow: hidden; }
        .lf-card::before { content: ""; position: absolute; inset: -2px; background: radial-gradient(800px 200px at 20% -10%, rgba(127,90,240,.12), transparent 60%), radial-gradient(600px 200px at 120% -20%, rgba(0,198,207,.10), transparent 60%); pointer-events: none; }
        .lf-title { display:flex; align-items:center; justify-content:space-between; margin-bottom: 6px; }
        .lf-title h3 { font-family: "Space Grotesk", sans-serif; font-size: 20px; margin: 0; background: linear-gradient(120deg, #7F5AF0, #00C6CF); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .lf-desc { margin: 0 0 8px; color: var(--muted); font-size: 12px; }
        .lf-chipbar { display:flex; gap:10px; flex-wrap: wrap; }
        label.chip { position: relative; display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--border); background:var(--elev); color:var(--text); border-radius: 999px; cursor:pointer; transition: transform .15s cubic-bezier(.22,1,.36,1), box-shadow .15s cubic-bezier(.22,1,.36,1), border-color .15s; }
        label.chip:hover { transform: translateY(-1px); box-shadow: var(--shadow); border-color: color-mix(in oklab, var(--border), var(--text) 25%); }
        label.chip input { position:absolute; inset:0; opacity:0; pointer-events:none; }
        label.chip:has(input:checked) { background: var(--primary); border-color: var(--primary); color:white; }
        .lf-actions { display:flex; gap:8px; margin-top:8px }
        .lf-card input[type="text"], .lf-card input[type="number"], .lf-card textarea, .lf-card select { background: var(--elev); color: var(--text); border:1px solid var(--border); border-radius:10px; outline:none; transition: box-shadow .15s, border-color .15s; }
        .lf-card input:focus, .lf-card textarea:focus, .lf-card select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary), transparent 70%); }
      `}} />

      <div className="lf-title">
        <h3 className="lf-h3">{initial ? "Edit Listing" : "New Listing"}</h3>
      </div>
      <p className="lf-desc">Fill in the details below and hit Save. You can toggle categories, languages, and devices as chips.</p>
      <div style={row}><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={(e)=>set("name", e.target.value)} required /></div>
      <div style={row}><label style={lbl}>Headline</label><input style={inp} value={form.headline} onChange={(e)=>set("headline", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Description</label><textarea style={ta} value={form.description} onChange={(e)=>set("description", e.target.value)} rows={4} /></div>
      
      {/* Category selection with checkboxes */}
      <div style={row}>
        <label style={lbl}>Categories</label>
        <div className="lf-chipbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'reddit', label: '👽 Reddit' },
            { key: 'instagram', label: '📸 Instagram' },
            { key: 'x', label: '𝕏 X (Twitter)' },
            { key: 'facebook', label: '📘 Facebook' },
            { key: 'chat support', label: '💬 Chat Support' },
            { key: 'tiktok', label: '🎵 Tiktok' },
            { key: 'threads', label: '🧵 Threads' }
          ].map((cat) => (
            <label key={cat.key} className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.categories.includes(cat.key)}
                onChange={() => toggleCategory(cat.key)}
                style={{ width: 16, height: 16, opacity: 0, position: 'absolute' }}
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Selected: {form.categories.length > 0 ? form.categories.join(', ') : 'None'}
        </div>
      </div>
      
      {/* Language selection with checkboxes */}
      <div style={row}>
        <label style={lbl}>Languages</label>
        <div className="lf-chipbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['English', 'German', 'French', 'Spanish', 'Italian'].map((lang) => (
            <label key={lang} className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.languages.includes(lang.toLowerCase())}
                onChange={() => toggleLanguage(lang.toLowerCase())}
                style={{ width: 16, height: 16, opacity: 0, position: 'absolute' }}
              />
              <span>{lang}</span>
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Selected: {form.languages.length > 0 ? form.languages.join(', ') : 'None'}
        </div>
      </div>
      
      <div style={row}>
        <label style={lbl}>Age range</label>
        <select style={inp} value={form.age_range} onChange={(e)=>set("age_range", e.target.value)}>
          <option value="">—</option>
          <option>18-20</option>
          <option>20-25</option>
          <option>25-30</option>
          <option>30+</option>
        </select>
      </div>
      <div style={row}>
        <label style={lbl}>Sex</label>
        <select style={inp} value={form.sex} onChange={(e)=>set("sex", e.target.value)}>
          <option value="">—</option>
          <option>male</option>
          <option>female</option>
        </select>
      </div>
      
      {/* Device selection with checkboxes */}
      <div style={row}>
        <label style={lbl}>Devices</label>
        <div className="lf-chipbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'windows', label: 'Windows' },
            { key: 'macos', label: 'MacOS' }
          ].map((device) => (
            <label key={device.key} className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.devices.includes(device.key)}
                onChange={() => toggleDevice(device.key)}
                style={{ width: 16, height: 16, opacity: 0, position: 'absolute' }}
              />
              <span>{device.label}</span>
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Selected: {form.devices.length > 0 ? form.devices.join(', ') : 'None'}
        </div>
      </div>
      
      <div style={row}>
        <label style={lbl}>Availability</label>
        <select style={inp} value={form.availability} onChange={(e)=>set("availability", e.target.value)}>
          <option value="">—</option>
          <option>full-time</option>
          <option>part-time</option>
        </select>
      </div>
      <div style={row}>
        <label style={lbl}>Location</label>
        <select style={inp} value={form.location} onChange={(e)=>set("location", e.target.value)}>
          <option value="">—</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Canada</option>
          <option>Australia</option>
          <option>New Zealand</option>
          <option>Ireland</option>
          <option>Germany</option>
          <option>France</option>
          <option>Italy</option>
          <option>Spain</option>
          <option>Portugal</option>
          <option>Netherlands</option>
          <option>Belgium</option>
          <option>Switzerland</option>
          <option>Austria</option>
          <option>Sweden</option>
          <option>Norway</option>
          <option>Denmark</option>
          <option>Finland</option>
          <option>Poland</option>
          <option>Czechia</option>
          <option>Romania</option>
          <option>Greece</option>
          <option>Hungary</option>
          <option>Bulgaria</option>
          <option>Croatia</option>
          <option>Serbia</option>
          <option>Turkey</option>
          <option>Ukraine</option>
          <option>Russia</option>
          <option>Brazil</option>
          <option>Mexico</option>
          <option>Argentina</option>
          <option>Chile</option>
          <option>Colombia</option>
          <option>Peru</option>
          <option>Philippines</option>
          <option>India</option>
          <option>Indonesia</option>
          <option>Malaysia</option>
          <option>Singapore</option>
          <option>Thailand</option>
          <option>Vietnam</option>
          <option>Japan</option>
          <option>South Korea</option>
          <option>China</option>
          <option>South Africa</option>
          <option>Nigeria</option>
          <option>Kenya</option>
          <option>Egypt</option>
          <option>United Arab Emirates</option>
        </select>
      </div>
      <div style={row}><label style={lbl}>Hourly rate ($/hr)</label><input style={inp} type="number" min="0" step="0.01" value={form.hourly_rate} onChange={(e)=>set("hourly_rate", e.target.value)} required /></div>
      <div style={row}>
        <label style={lbl}>Purchase Price</label>
        <div className="lf-chipbar">
          {[49,99].map((v)=> (
            <label key={v} className="chip">
              <input type="radio" name="purchasePrice" checked={Number(form.purchase_price)===v} onChange={()=>set("purchase_price", v)} />
              <span>${v}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <input id="active" type="checkbox" checked={form.is_active} onChange={(e)=>set("is_active", e.target.checked)} />
        <label htmlFor="active">Active</label>
      </div>

      {error && <p style={{color:'#ff8a8a', fontSize:12}}>{error}</p>}

      <div className="lf-actions" style={{display:'flex', gap:8, marginTop:8}}>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} style={btn}>Cancel</button>
        {initial?.id && (
          <button type="button" onClick={onDelete} style={btnDanger}>Delete</button>
        )}
      </div>
    </form>
  );
}

const card = { display:'grid', gap:10, border:'1px solid var(--border)', borderRadius:12, background:'var(--surface)', padding:14 };
const row = { display:'grid', gap:6 };
const lbl = { fontSize:12, color:'var(--muted)', fontWeight:600 };
const inp = { padding:'10px 12px', border:'1px solid var(--border)', borderRadius:10, background:'var(--elev)', color:'var(--text)' };
const ta = inp;
const btn = { padding:'10px 12px', borderRadius:10, background:'var(--elev)', color:'var(--text)', border:'1px solid var(--border)', cursor:'pointer' };
const btnPrimary = { ...btn, background:'#7f5af0', borderColor:'#7f5af0', color:'#fff' };
const btnDanger = { ...btn, background:'#3b0f14', borderColor:'#652127', color:'#ff8a8a' };