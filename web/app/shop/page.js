import ClientShop from "./ClientShop";

export default function ShopPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* Additional styles for the shop page */
        .browse-hero {
          position: relative; overflow: hidden; padding: 80px 0; text-align: center;
        }
        #constellation { position: absolute; inset: 0; z-index: 1; opacity: 0.8;}
        .browse-hero-content { position: relative; z-index: 10; }
        .browse-hero h1 {
          font-family: "Space Grotesk", sans-serif; font-size: clamp(2.5rem, 5vw, 3.5rem);
          margin: 0 auto 12px; max-width: 700px;
        }
        .browse-hero .gradient-text {
          background: linear-gradient(120deg, var(--primary), var(--accent-1), var(--accent-2));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .browse-hero p { max-width: 550px; margin: 0 auto 32px; color: var(--muted); font-size: 18px;}
        .search-bar {
          max-width: 960px; margin: 0 auto;
          padding: 20px; border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)),
            linear-gradient(120deg, rgba(127,90,240,.10), rgba(0,198,207,.08));
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 10px 30px rgba(0,0,0,.35);
          backdrop-filter: saturate(140%) blur(8px);
          display: flex; align-items: center; gap: 16px;
        }
        .search-input-wrap { position: relative; display: flex; align-items: center; background: var(--elev); border: 1px solid var(--border); border-radius: var(--pill); flex: 1; }
        .search-icon { position: absolute; left: 20px; color: var(--muted); width: 24px; height: 24px; pointer-events: none; }
        .clear-btn { position: absolute; right: 16px; display: none; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }
        .input {
          width: 100%; padding: 16px 360px; border-radius: var(--pill); outline: none;
          border: 0; background: transparent;
          color: var(--text); transition: all .2s var(--ease-out); min-height: 56px;
          font-size: 18px;
        }
        .btn-primary { background: var(--primary); border: 1px solid var(--primary); color: white; border-radius: 10px; font-weight: 600; padding: 8px 10px; cursor: pointer; transition: transform .2s var(--ease-out); min-height: 44px; font-size: 16px; }
        @media (min-width: 900px) { .search-bar { grid-template-columns: 1fr auto; align-items: center; padding: 12px; } }

        /* Categories Section */
        .categories-section { padding: 10px 0 80px; text-align: center; position: relative; z-index: 10; overflow: visible; }
        .categories-section h2 { font-family: "Space Grotesk", sans-serif; font-size: 24px; margin-bottom: 24px; }
        .category-grid { 
          display: flex; 
          flex-wrap: nowrap; 
          gap: 16px; 
          overflow-x: hidden;
          justify-content: center;
          padding: 10px 0;
        }
        .category-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px;
          text-align: left; display: flex; align-items: center; gap: 12px;
          color: var(--muted); font-weight: 600; transition: all .2s var(--ease-out);
          flex: 1 1 0;
          min-width: 0;
          max-width: calc(100% / 7 - 16px);
        }
        .category-card:hover { transform: translateY(-4px); background: var(--elev); border-color: #444; color: var(--text); }
        .category-card.active { background: var(--elev); border-color: color-mix(in oklab, var(--primary), #444 40%); color: var(--text); box-shadow: 0 0 0 2px color-mix(in oklab, var(--primary), transparent 60%) inset; }
        .category-card span { font-size: 24px; flex-shrink: 0; } /* Emoji */
        .category-card div { 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          min-width: 0;
        }
        /* Main Content Wrapper */
        .main-listings-area { padding: 0 0; }

        /* Advanced Filters Bar */
        .filters-bar { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
        .filter-group { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--pill); padding: 8px 10px; }
        .filter-group legend, .filter-group .label { font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: .02em; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 8px; }
        label.chip { position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        label.chip input { position: absolute; opacity: 0; pointer-events: none; }
        label.chip span { display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--pill); min-height: 36px; color: var(--text); background: var(--elev); font-weight: 500; }
        label.chip input:checked + span { background: var(--primary); border-color: var(--primary); color: #fff; }
        .filter-select { padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--elev); color: var(--text); }
        .rate { display: flex; align-items: center; gap: 10px; }
        .rate input[type="range"] { width: 160px; }

        /* Listings */
        .listings-container {
          margin-top: var(--space-4);
          display: grid; grid-template-columns: 1fr; gap: var(--card-gap);
        }
        .listing-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: var(--card-pad);
          display: grid; grid-template-columns: auto 1fr; grid-template-areas: "avatar name" "avatar meta";
          align-items: center; gap: var(--card-gap);
          transition: all .2s var(--ease-out);
          container-type: inline-size;
        }
        .listing-card:hover {
          transform: translateY(-4px); box-shadow: var(--shadow);
          border-color: #444;
        }
        .listing-card .avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .listing-card .name { font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: var(--text-lg); color: var(--text); }
        .listing-card .headline { color: var(--muted); margin-top: -2px; }
        .skills { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
        .skill {
          font-size: 12px; padding: 6px 10px; border-radius: var(--pill);
          border: 1px solid var(--border); color: var(--muted); background: var(--elev);
        }
        .listing-meta { text-align: left; grid-area: meta; }
        .listing-meta .price { font-size: 20px; font-weight: 700; color: var(--text); }
        .listing-meta .rating { color: var(--muted); font-size: 14px; font-weight: 500; }

        @media (min-width: 900px) {
          .listing-card { grid-template-columns: auto 1fr auto; grid-template-areas: "avatar name meta"; }
          .listing-meta { text-align: right; }
        }

        /* Container query tuning for very narrow cards */
        @container (max-width: 380px) {
          .listing-card .avatar { width: 40px; height: 40px; }
          .listing-meta .price { font-size: 18px; }
          .btn-primary { padding: 10px 16px; }
        }

        /* Focus styles */
        :focus-visible { outline: 2px solid color-mix(in oklab, var(--primary), white 20%); outline-offset: 2px; }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal.in { transition: none !important; transform: none !important; }
          #constellation { display: none !important; }
        }
      `}} />
      <ClientShop />
    </>
  );
}