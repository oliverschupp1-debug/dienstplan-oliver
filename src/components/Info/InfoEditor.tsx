import React, { useState } from "react";
import "./InfoPage.css";

export default function InfoEditor({ stationId, onSave, onCancel }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Standard: alle Rollen dürfen es sehen
  const [visibleRoles, setVisibleRoles] = useState([
    "employee",
    "planner",
    "admin"
  ]);

  function toggleRole(role: string) {
    setVisibleRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  }

  function save() {
    const t = title.trim();
    const c = content.trim();

    if (!t || !c) return;

    // Übergabe an InfoPageWrapper → dieser ruft createNews() auf
    onSave({
      station_id: stationId,
      title: t,
      content: c,
      visible_for_roles: visibleRoles
    });

    // Felder zurücksetzen
    setTitle("");
    setContent("");
  }

  return (
    <div className="info-editor-root">
      <h2>Neue Info</h2>

      {/* TITEL */}
      <input
        className="info-input"
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* INHALT */}
      <textarea
        className="info-textarea"
        placeholder="Inhalt"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* SICHTBARKEIT */}
      <div className="info-role-selector">
        {["employee", "planner", "admin"].map((role) => (
          <label key={role} className="info-role-item">
            <input
              type="checkbox"
              checked={visibleRoles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}
      </div>

      {/* BUTTONS */}
      <div className="info-editor-buttons">
        <button className="info-save-btn" onClick={save}>
          Speichern
        </button>

        <button className="info-cancel-btn" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
