"use client";

import { useEffect, useRef } from "react";
import ThemeToggle from "./components/ThemeToggle";

export default function ClientHome() {
  const canvasRef = useRef(null);
  const whyUsRef = useRef(null);
  const listingsTrackRef = useRef(null);
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);

  useEffect(() => {
    // Reveal on scroll
    const ioReveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("in");
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => ioReveal.observe(el));

    // Card hover glow
    const onCardMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
      e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };
    const cardEls = Array.from(document.querySelectorAll('.card'));
    cardEls.forEach(c => c.addEventListener('mousemove', onCardMove));

    // Tilt effect for why-us image
    const wrap = whyUsRef.current;
    const img = wrap?.querySelector('.process-visual');
    const tilt = (e) => {
      if (!wrap || !img) return;
      const max = 6;
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      img.style.transform = `rotateY(${x*max}deg) rotateX(${-y*max}deg) translateZ(14px) scale(1.02)`;
    };
    const tiltReset = () => { if (img) img.style.transform = ''; };
    wrap?.addEventListener('mousemove', tilt);
    wrap?.addEventListener('mouseleave', tiltReset);

    // Constellation canvas animation
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    let dots = [];
    let running = true;
    let raf = 0;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;
    const particleFactor = prefersReduced ? 0 : (isSmall ? 0.5 : 1);
    const setupCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots = [];
      const baseCount = canvas.width / 18;
      const count = Math.max(10, Math.floor(baseCount * particleFactor));
      for (let i = 0; i < count; i++) {
        dots.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: -0.5+Math.random(), vy: -0.5+Math.random(), radius: Math.random()*1.5 });
      }
    };
    setupCanvas();
    const onVis = () => { running = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);
    const ioCanvas = new IntersectionObserver(([entry]) => { running = entry.isIntersecting; }, { threshold: 0.1 });
    if (canvas) ioCanvas.observe(canvas);
    const animate = () => {
      if (running && !prefersReduced && canvas && ctx) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        dots.forEach(d => {
          d.x += d.vx; d.y += d.vy;
          if (d.x < 0 || d.x > canvas.width) d.vx = -d.vx;
          if (d.y < 0 || d.y > canvas.height) d.vy = -d.vy;
          ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI*2); ctx.fillStyle = 'rgba(127, 90, 240, 0.6)'; ctx.fill();
        });
        for (let i=0;i<dots.length;i++){
          for (let j=i+1;j<dots.length;j++){
            const dist = Math.hypot(dots[i].x-dots[j].x, dots[i].y-dots[j].y);
            if (dist < 120){
              ctx.strokeStyle = `rgba(127, 90, 240, ${0.8 - dist/120})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);

    // Carousel
    const track = listingsTrackRef.current;
    const btnPrev = prevBtnRef.current;
    const btnNext = nextBtnRef.current;
    let page = 0; let pages = [];
    const updateCarousel = () => {
      if (!track) return;
      track.style.transform = `translateX(-${page * 100}%)`;
      if (btnPrev) btnPrev.disabled = pages.length <= 1;
      if (btnNext) btnNext.disabled = pages.length <= 1;
    };
    const chunk = (arr, size) => { const out=[]; for (let i=0;i<arr.length;i+=size) out.push(arr.slice(i,i+size)); return out; };
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const initials = (name='') => (name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('')||'VA').toUpperCase();
    const fmtRate = (n) => { const x = Number(n); return Number.isFinite(x) ? `$${x.toFixed(0)}/hr` : ''; };
    const fmtPrice = (n) => { const x = Number(n); return Number.isFinite(x) ? `$${x.toFixed(0)}` : '$99'; };
    const card = (r) => {
      const skills = [];
      (r.categories||[]).slice(0,2).forEach(c=>skills.push(c));
      (r.languages||[]).slice(0,2).forEach(l=>skills.push(l));
      (r.devices||[]).slice(0,2).forEach(d=>skills.push(d));
      return `
        <article class="card reveal">
          <div class="card-top">
            <div style="display:flex;gap:10px;align-items:center">
              <div class="avatar">${esc(initials(r.name))}</div>
              <div>
                <h3 style="margin:0">${esc(r.name||'—')}${r.availability ? ` <span style="margin-left:8px;font-size:12px;color:#60a5fa;opacity:.9;font-weight:600">${esc(r.availability==='full-time'?'Full-time':(r.availability==='part-time'?'Part-time':String(r.availability)))}</span>` : ''}</h3>
                ${r.rating ? `<span class=\"badge\" style=\"margin-top:4px\">⭐ ${esc(Number(r.rating).toFixed(1))}${r.reviews_count ? ` (${esc(r.reviews_count)} reviews)` : ''}</span>` : ''}
                <div class=\"per-hour\" style=\"color:var(--muted);font-size:14px;margin-top:4px\">${esc(fmtRate(r.hourly_rate).replace('/hr',''))} per hour</div>
              </div>
            </div>
            <div style="font-weight:700;font-size:18px">${fmtPrice(r.purchase_price)}</div>
          </div>
          <div class="skills">${skills.map(s => `<span class=\"skill\">${esc(s)}</span>`).join('')}</div>
          <div class="card-actions">
            <a class="btn btn-primary" href="/p/${esc(r.id)}">View Profile</a>
          </div>
        </article>`;
    };
    const render = (rows=[]) => {
      if (!track) return;
      pages = chunk(rows, 3);
      if (!pages.length) {
        track.innerHTML = '<div class="carousel-page"><div class="cards"><p style="color:var(--muted);text-align:center;width:100%;margin:12px 0">No experts available yet.</p></div></div>';
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        return;
      }
      track.innerHTML = pages.map(group => `
        <div class="carousel-page">
          <div class="cards">
            ${group.map(card).join('')}
          </div>
        </div>
      `).join('');
      track.querySelectorAll('.reveal').forEach(el => ioReveal.observe(el));
      page = 0;
      if (btnPrev) btnPrev.style.display = '';
      if (btnNext) btnNext.style.display = '';
      updateCarousel();
    };
    const load = async () => {
      try {
        const res = await fetch('/api/listings?limit=30', { cache: 'no-store' });
        const json = await res.json();
        render(Array.isArray(json?.data) ? json.data : []);
      } catch { render([]); }
    };
    btnNext?.addEventListener('click', () => { if (!pages.length) return; page = (page + 1) % pages.length; updateCarousel(); });
    btnPrev?.addEventListener('click', () => { if (!pages.length) return; page = (page - 1 + pages.length) % pages.length; updateCarousel(); });
    load();

    return () => {
      // Cleanup
      ioReveal.disconnect();
      cardEls.forEach(c => c.removeEventListener('mousemove', onCardMove));
      wrap?.removeEventListener('mousemove', tilt);
      wrap?.removeEventListener('mouseleave', tiltReset);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="page-shell" style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
        <div className="prologue-hero">
          <canvas ref={canvasRef} id="constellation" aria-hidden="true"></canvas>
          <div className="prologue-hero-content">
            <h1>Your <span className="highlight">game	changing</span> Virtual Assistant is here.</h1>
            <p className="subtitle">Tired of wasting time on unreliable VAs? We provide handpicked Virtual Assistants, fully trained and ready from day one.</p>
            <div className="cta-group">
              <a className="btn btn-primary" href="/shop"><span className="animated-browse">Browse assistants</span></a>
              <a className="btn" href="/faq">Why Urzistaff?</a>
            </div>
          </div>
        </div>

        <main className="main-content" id="content">
          <section className="section" id="why-us">
            <div className="container grid-2">
              <div className="why-us-text reveal">
                <h2 className="section-title" style={{textAlign:'left', marginBottom:16}}>Stop the endless interviews.</h2>
                <p style={{color:'var(--muted)', fontSize:'var(--text-lg)'}}>Hiring the wrong VA doesn’t just cost money – it costs time, endless frustration, and tasks that never get done the way you need them. That’s why we built Urzistaff.</p>
                <ul className="feature-list">
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span><strong>VAs trained to follow systems & SOPs.</strong> Skip the learning curve.</span>
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span><strong>Proven reliability.</strong> All assistants are tested for IQ, English proficiency, and typing speed.</span>
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span><strong>Instant replacement guarantee.</strong> If your VA underperforms, we replace them at no cost and with zero downtime.</span>
                  </li>
                  <li>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    <span><strong>Ongoing support.</strong> You're never left alone in the process. We're here to help.</span>
                  </li>
                </ul>
              </div>
              <div className="why-us-visual reveal" ref={whyUsRef}>
                <img loading="lazy" src="/why-us.png" alt="Professionals collaborating" className="process-visual" />
              </div>
            </div>
          </section>

          <section className="section" id="browse" style={{background:'var(--surface)'}}>
            <div className="container">
              <h2 className="section-title reveal">Browse Available Experts</h2>
              <p className="section-subtitle reveal">Write @raegency(Telegram) to get your VAs today.</p>
              <div className="carousel">
                <button className="carousel-btn prev" ref={prevBtnRef} aria-label="Previous">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div className="carousel-viewport">
                  <div className="carousel-track" ref={listingsTrackRef}></div>
                </div>
                <button className="carousel-btn next" ref={nextBtnRef} aria-label="Next">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </section>

          <section className="section" id="guarantee">
            <div className="container">
              <div className="guarantee-box reveal">
                <h3>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Our Replacement Guarantee
                </h3>
                <p>We make sure you never lose time or money. If the VA you hire doesn’t respond within 72 hours, or becomes unavailable within the first 2 weeks after hiring, you’ll be able to choose another VA of the same value — or multiple VAs that match the original value.</p>
              </div>
            </div>
          </section>

          <section className="cta-section" id="contact">
            <div className="container">
              <h2 className="reveal">Ready to reclaim your time?</h2>
              <p className="reveal">We only accept a limited number of new clients each month to ensure quality.</p>
              <div className="reveal">
                <a href="https://t.me/raegency" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Write @raegency to get your VAs today</a>
              </div>
            </div>
          </section>
        </main>

        <div className="footer-push">
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}
