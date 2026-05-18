import React from "react";
import InfoCard from "./InfoCard";

export default function InfoPage({ news = [], unreadCount = 0, onOpenDetail }) {
  const safeNews = Array.isArray(news) ? news : [];

  return (
    <div>
      <h2 style={{ marginBottom: "20px" }}>
        Infos {unreadCount > 0 ? `(${unreadCount} ungelesen)` : ""}
      </h2>

      {safeNews.length === 0 && (
        <p style={{ opacity: 0.6 }}>Keine Infos vorhanden.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {safeNews.map((n) => (
          <InfoCard
            key={n.id}
            info={n}
            onClick={() => onOpenDetail && onOpenDetail(n)}
          />
        ))}
      </div>
    </div>
  );
}
