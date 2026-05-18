// src/components/EmployeePanel.tsx
import { useState } from "react";
import { useEmployees } from "../hooks/useEmployees";
import "./EmployeePanel.css";

type Props = {
  stationId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function EmployeePanel({ stationId, isOpen, onClose }: Props) {
  const {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = useEmployees(stationId);

  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState<number | null>(null);
  const [newRemarks, setNewRemarks] = useState("");

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  return (
    <>
      {/* OVERLAY */}
      <div className={`employee-overlay ${isOpen ? "open" : ""}`} onClick={onClose} />

      {/* PANEL */}
      <div className={`employee-panel ${isOpen ? "open" : ""}`}>
        <div className="panel-header">
          <h2 className="employee-title">Mitarbeiter verwalten</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && <p>Lade Mitarbeiter…</p>}

        {!loading && (
          <>
            <h3>Liste</h3>

            {employees.map((emp) => (
              <div key={emp.id} className="employee-item">
                {/* Name */}
                <input
                  type="text"
                  value={emp.name}
                  onChange={(e) =>
                    updateEmployee(
                      emp.id,
                      e.target.value,
                      emp.max_hours,
                      emp.remarks ?? ""
                    )
                  }
                  className="employee-input"
                />

                {/* Max Stunden */}
                <input
                  type="number"
                  value={emp.max_hours ?? ""}
                  placeholder="Max Stunden"
                  onChange={(e) =>
                    updateEmployee(
                      emp.id,
                      emp.name,
                      e.target.value ? Number(e.target.value) : null,
                      emp.remarks ?? ""
                    )
                  }
                  className="employee-input"
                />

                {/* Bemerkungen */}
                <textarea
                  placeholder="Bemerkungen"
                  value={emp.remarks ?? ""}
                  onChange={(e) => {
                    updateEmployee(
                      emp.id,
                      emp.name,
                      emp.max_hours,
                      e.target.value
                    );
                    autoResize(e.target);
                  }}
                  ref={(el) => autoResize(el)}
                  className="employee-textarea"
                />

                {/* Entfernen */}
                <button
                  className="delete-btn"
                  onClick={() => deleteEmployee(emp.id)}
                >
                  Entfernen
                </button>
              </div>
            ))}

            <h3>Neuen Mitarbeiter hinzufügen</h3>

            {/* Neuer Name */}
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="employee-input"
            />

            {/* Neue Max Stunden */}
            <input
              type="number"
              placeholder="Max Stunden"
              value={newHours ?? ""}
              onChange={(e) =>
                setNewHours(e.target.value ? Number(e.target.value) : null)
              }
              className="employee-input"
            />

            {/* Neue Bemerkungen */}
            <textarea
              placeholder="Bemerkungen"
              value={newRemarks}
              onChange={(e) => {
                setNewRemarks(e.target.value);
                autoResize(e.target);
              }}
              ref={(el) => autoResize(el)}
              className="employee-textarea"
            />

            {/* Hinzufügen */}
            <button
              className="add-btn"
              onClick={() => {
                if (newName.trim().length === 0) return;
                addEmployee(newName, newHours, newRemarks);
                setNewName("");
                setNewHours(null);
                setNewRemarks("");
              }}
            >
              Hinzufügen
            </button>
          </>
        )}
      </div>
    </>
  );
}
