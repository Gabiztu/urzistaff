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
    is_active: true,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        headline: initial.headline || "",
        description: initial.description || "",
        categories: initial.categories || [], // Keep as array
        languages: initial.languages || [], // Keep as array
        skills: (initial.skills || []).join(", "),
        age_range: initial.age_range || "",
        sex: initial.sex || "",
        devices: initial.devices || [], // Keep as array
        availability: initial.availability || "",
        location: initial.location || "",
        hourly_rate: Number(initial.hourly_rate || 0),
        is_active: Boolean(initial.is_active ?? true),
      });
    }
  }, [initial]);

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
    <form onSubmit={onSubmit} style={card}>
      <h3 style={{margin:0}}>{initial ? "Edit Listing" : "New Listing"}</h3>
      <div style={row}><label style={lbl}>Name</label><input style={inp} value={form.name} onChange={(e)=>set("name", e.target.value)} required /></div>
      <div style={row}><label style={lbl}>Headline</label><input style={inp} value={form.headline} onChange={(e)=>set("headline", e.target.value)} /></div>
      <div style={row}><label style={lbl}>Description</label><textarea style={ta} value={form.description} onChange={(e)=>set("description", e.target.value)} rows={4} /></div>
      
      {/* Category selection with checkboxes */}
      <div style={row}>
        <label style={lbl}>Categories</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'reddit', label: '👽 Reddit' },
            { key: 'instagram', label: '📸 Instagram' },
            { key: 'x', label: '𝕏 X (Twitter)' },
            { key: 'facebook', label: '📘 Facebook' },
            { key: 'chat support', label: '💬 Chat Support' },
            { key: 'tiktok', label: '🎵 Tiktok' },
            { key: 'threads', label: '🧵 Threads' }
          ].map((cat) => (
            <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.categories.includes(cat.key)}
                onChange={() => toggleCategory(cat.key)}
                style={{ width: 16, height: 16 }}
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['English', 'Spanish', 'Italian'].map((lang) => (
            <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.languages.includes(lang.toLowerCase())}
                onChange={() => toggleLanguage(lang.toLowerCase())}
                style={{ width: 16, height: 16 }}
              />
              <span>{lang}</span>
            </label>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
          Selected: {form.languages.length > 0 ? form.languages.join(', ') : 'None'}
        </div>
      </div>
      
      <div style={row}><label style={lbl}>Skills (comma-separated)</label><input style={inp} value={form.skills} onChange={(e)=>set("skills", e.target.value)} placeholder="excel, notion, reddit" /></div>
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
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { key: 'windows', label: 'Windows' },
            { key: 'macos', label: 'MacOS' }
          ].map((device) => (
            <label key={device.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.devices.includes(device.key)}
                onChange={() => toggleDevice(device.key)}
                style={{ width: 16, height: 16 }}
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
      <div style={row}><label style={lbl}>Location</label><input style={inp} value={form.location} onChange={(e)=>set("location", e.target.value)} placeholder="Philippines" /></div>
      <div style={row}><label style={lbl}>Hourly rate ($/hr)</label><input style={inp} type="number" min="0" step="0.01" value={form.hourly_rate} onChange={(e)=>set("hourly_rate", e.target.value)} required /></div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <input id="active" type="checkbox" checked={form.is_active} onChange={(e)=>set("is_active", e.target.checked)} />
        <label htmlFor="active">Active</label>
      </div>

      {error && <p style={{color:'#ff8a8a', fontSize:12}}>{error}</p>}

      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
        <button type="button" onClick={onCancel} style={btn}>Cancel</button>
        {initial?.id && (
          <button type="button" onClick={onDelete} style={btnDanger}>Delete</button>
        )}
      </div>
    </form>
  );
}

const card = { display:'grid', gap:10, border:'1px solid #2b2a33', borderRadius:12, background:'#0f0f14', padding:14 };
const row = { display:'grid', gap:6 };
const lbl = { fontSize:12, color:'#94a3b8', fontWeight:600 };
const inp = { padding:'10px 12px', border:'1px solid #2b2a33', borderRadius:10, background:'#121218', color:'#e5e7eb' };
const ta = inp;
const btn = { padding:'10px 12px', borderRadius:10, background:'#2b2a33', color:'#e5e7eb', border:'1px solid #2b2a33', cursor:'pointer' };
const btnPrimary = { ...btn, background:'#7f5af0', borderColor:'#7f5af0', color:'#fff' };
const btnDanger = { ...btn, background:'#3b0f14', borderColor:'#652127', color:'#ff8a8a' };