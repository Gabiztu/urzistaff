"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

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
