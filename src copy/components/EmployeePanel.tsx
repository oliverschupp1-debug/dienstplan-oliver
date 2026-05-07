// src/components/EmployeePanel.tsx
import React, { useState } from "react";
import { useEmployees } from "../useEmployees";

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

  return (
    <div
      className="employee-panel"
      style={{
        position: "fixed",
        top: 0,
        right: isOpen ? 0 : "-400px",
        width: "400px",
        height: "100vh",
        background: "#fff",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        transition: "right 0.3s ease",
        padding: "20px",
        zIndex: 9999
      }}
    >
      <h2>Mitarbeiter verwalten</h2>

      <button onClick={onClose} style={{ float: "right" }}>
        ✕
      </button>

      {loading && <p>Lade Mitarbeiter…</p>}

      {!loading && (
        <>
          <h3>Liste</h3>
          {employees.map((emp) => (
            <div
              key={emp.id}
              style={{
                borderBottom: "1px solid #ddd",
                padding: "10px 0",
                marginBottom: "10px"
              }}
            >
              <input
                type="text"
                value={emp.name}
                onChange={(e) =>
                  updateEmployee(emp.id, e.target.value, emp.max_hours)
                }
                style={{ width: "100%", marginBottom: "6px" }}
              />

              <input
                type="number"
                value={emp.max_hours ?? ""}
                placeholder="Max Stunden"
                onChange={(e) =>
                  updateEmployee(
                    emp.id,
                    emp.name,
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                style={{ width: "100%", marginBottom: "6px" }}
              />

              <button
                onClick={() => deleteEmployee(emp.id)}
                style={{ background: "#d9534f", color: "#fff" }}
              >
                Entfernen
              </button>
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

          <button
            onClick={() => {
              if (newName.trim().length === 0) return;
              addEmployee(newName, newHours);
              setNewName("");
              setNewHours(null);
            }}
            style={{ background: "#0275d8", color: "#fff" }}
          >
            Hinzufügen
          </button>
        </>
      )}
    </div>
  );
}
