import React from "react";

export default function InfoCard({ info, onClick }) {
  if (!info) return null;

  const created = info.created_at
    ? new Date(info.created_at).toLocaleString("de-DE")
    : "Unbekannt";

  return (
    <div
      onClick={onClick}
      style={{
        padding: "16px",
        borderRadius: "8px",
        background: "var(--panel-bg)",
        cursor: "pointer",
        border: "1px solid var(--border)",
        transition: "0.15s",
        boxShadow: "var(--shadow)"
      }}
    >
      <h3 style={{ margin: 0 }}>{info.title ?? "Ohne Titel"}</h3>

      <p style={{ margin: "6px 0 0 0", opacity: 0.7 }}>
        {created}
      </p>
    </div>
  );
}
