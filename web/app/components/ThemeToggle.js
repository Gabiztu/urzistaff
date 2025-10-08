"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");
  const pathname = usePathname?.() || "";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      const initial = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', initial);
      setTheme(initial);
    } catch {
      document.documentElement.setAttribute('data-theme', 'light');
      setTheme('light');
    }
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
    setTheme(next);
  };

  const isAdminLogin = typeof pathname === 'string' && pathname.startsWith('/admin/login');

  if (isAdminLogin) {
    return (
      <section className="theme-toggle-section" aria-label="Theme switcher" style={{position:'fixed',left:0,right:0,bottom:0,borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
        <div className="theme-toggle-wrap" style={{justifyContent:'center'}}>
          <button type="button" className="theme-toggle-btn" onClick={toggle} aria-pressed={theme === 'dark'} style={{width:'auto'}}>
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="theme-toggle-section" aria-label="Theme switcher">
      <div className="theme-toggle-wrap">
        <div className="theme-toggle-title">Copyright by UrziStaff | All Rights Reserved by Gabriel Valentin Dragomir</div>
        <button type="button" className="theme-toggle-btn" onClick={toggle} aria-pressed={theme === 'dark'}>
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </div>
    </section>
  );
}
