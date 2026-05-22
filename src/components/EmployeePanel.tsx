import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useEmployees } from "../hooks/useEmployees";

type Props = {
  stationId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function EmployeePanel({ stationId, isOpen, onClose }: Props) {
  const role = useAppStore((s) => s.role);

  // ⭐ Mitarbeiter laden (nur wenn stationId existiert)
  const { employees } = useEmployees(stationId);

  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState<number | null>(null);
  const [newRemarks, setNewRemarks] = useState("");

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  if (!isOpen) return null;

  // ⭐ Mitarbeiter (role === employee) → KEINE Liste anzeigen
  if (role === "employee") {
    return (
      <div className="slide-panel">
        <button onClick={onClose} style={{ float: "right" }}>
          ✕
        </button>

        <h2>Hallo 🙂</h2>
        <p style={{ fontSize: "1.2em", marginTop: "10px" }}>
          Diese Seite ist nur für Admins und Planer sichtbar.
        </p>
      </div>
    );
  }

  // ⭐ Admin & Planner → normale Ansicht
  return (
    <div className="slide-panel">
      <h2>Mitarbeiter verwalten</h2>

      <button onClick={onClose} style={{ float: "right" }}>
        ✕
      </button>

      <h3>Liste</h3>

      {employees.length === 0 && (
        <div style={{ marginBottom: "10px", color: "#777" }}>
          Keine Mitarbeiter gefunden.
        </div>
      )}

      {employees.map((emp) => (
        <div
          key={emp.id}
          style={{
            borderBottom: "1px solid #ddd",
            padding: "10px 0",
            marginBottom: "10px",
          }}
        >
          <div style={{ fontWeight: 600 }}>{emp.name}</div>
          <div>Max. Stunden: {emp.max_hours ?? "-"}</div>
          <div>Bemerkungen: {emp.remarks ?? "-"}</div>
        </div>
      ))}

      <h3>Neuen Mitarbeiter hinzufügen</h3>

      <input
        type="text"
        placeholder="Name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        style={{ width: "100%", marginBottom: "6px" }}
      />

      <input
        type="number"
        placeholder="Max Stunden"
        value={newHours ?? ""}
        onChange={(e) =>
          setNewHours(e.target.value ? Number(e.target.value) : null)
        }
        style={{ width: "100%", marginBottom: "6px" }}
      />

      <textarea
        placeholder="Bemerkungen"
        value={newRemarks}
        onChange={(e) => {
          setNewRemarks(e.target.value);
          autoResize(e.target);
        }}
        ref={(el) => autoResize(el)}
        style={{
          width: "100%",
          resize: "none",
          overflow: "hidden",
          marginBottom: "10px",
          padding: "6px",
        }}
      />

      <button
        style={{ background: "#0275d8", color: "#fff" }}
        onClick={() => {
          alert(
            "⚠️ Mitarbeiter können aktuell NICHT hinzugefügt werden, weil du Modus A (nur anzeigen) aktiviert hast."
          );
        }}
      >
        Hinzufügen (derzeit deaktiviert)
      </button>
    </div>
  );
}
