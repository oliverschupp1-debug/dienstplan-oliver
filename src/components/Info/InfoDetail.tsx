import React from "react";
import "./InfoPage.css";

export default function InfoDetail({
  info,
  isRead = false,
  onClose,
  onMarkRead,
  onDelete,
  role
}) {
  if (!info) return null;

  const canDelete = role === "admin" || role === "planner";

  const created = info.created_at
    ? new Date(info.created_at).toLocaleString("de-DE")
    : "Unbekannt";

  return (
    <div className="info-detail-root">
      <div className="info-detail-card">

        {/* CLOSE BUTTON */}
        <button className="info-close" onClick={onClose}>×</button>

        {/* TITLE */}
        <h2>{info.title ?? "Ohne Titel"}</h2>

        {/* DATE */}
        <p className="info-date">{created}</p>

        {/* CONTENT */}
        <div className="info-content">
          {info.content ?? "Kein Inhalt vorhanden."}
        </div>

        {/* MARK AS READ */}
        {!isRead && (
          <button
            className="info-read-btn"
            onClick={() => onMarkRead && onMarkRead(info.id)}
          >
            Als gelesen markieren
          </button>
        )}

        {/* DELETE */}
        {canDelete && (
          <button
            className="info-delete-btn"
            onClick={() => onDelete && onDelete(info.id)}
          >
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}
