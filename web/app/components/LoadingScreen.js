"use client";

export default function LoadingScreen({ label = "Loading…", full = true }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: full ? "min(100vh, 100dvh)" : 180,
        padding: 16,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes droid-spin { to { transform: rotate(360deg); } }
            .droid-spinner { width: 46px; height: 46px; border-radius: 9999px; border: 3px solid var(--border); border-top-color: var(--primary); animation: droid-spin .9s linear infinite; }
            .droid-label { margin-top: 10px; color: var(--muted); font-weight: 600; letter-spacing: .02em; }
          `,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="droid-spinner" />
        {label ? <div className="droid-label">{label}</div> : null}
      </div>
    </div>
  );
}
