import React, { useState } from "react";
import "./EmployeeList.css";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  employees: Employee[];
  loading: boolean;
};

export default function EmployeeList({ employees, loading }: Props) {
  const [filter, setFilter] = useState("");

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, employeeId: string) {
    const payload = { employeeId };
    e.dataTransfer.setData("text/plain", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="employee-panel">
      <div className="employee-header">
        <h3>Mitarbeiter</h3>
        <input
          className="employee-search"
          placeholder="Suchen…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="employee-list">
        {loading && <div className="employee-loading">Lade Mitarbeiter…</div>}

        {!loading && filtered.length === 0 && (
          <div className="employee-empty">Keine Mitarbeiter gefunden</div>
        )}

        {!loading &&
          filtered.map((emp) => (
            <div
              key={emp.id}
              className="employee-item"
              draggable
              onDragStart={(e) => handleDragStart(e, emp.id)}
            >
              <div className="employee-avatar">
                {emp.name.slice(0, 1).toUpperCase()}
              </div>

              <div className="employee-name">{emp.name}</div>
            </div>
          ))}
      </div>
    </div>
  );
}
