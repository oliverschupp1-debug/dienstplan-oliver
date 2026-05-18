import React from "react";
import "./EmployeeList.css";

type Props = {
  employees: { id: string; name: string }[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
};

export default function EmployeeList({
  employees,
  selectedEmployeeId,
  onSelectEmployee
}: Props) {
  return (
    <div className="employee-list">
      <h3 className="employee-list-title">Mitarbeiter</h3>

      <div className="employee-scroll">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className={`employee-item ${
              selectedEmployeeId === emp.id ? "selected" : ""
            }`}
            draggable
            onDragStart={(e) => {
              // KORREKT: Kalender liest "employeeId"
              e.dataTransfer.setData("employeeId", emp.id);
            }}
            onClick={() => onSelectEmployee(emp.id)}
          >
            {emp.name}
          </div>
        ))}

        {employees.length === 0 && (
          <div className="employee-empty">Keine Mitarbeiter gefunden</div>
        )}
      </div>
    </div>
  );
}
