import React from "react";
import { useEmployees } from "../hooks/useEmployees";
import { useMonthlyHours } from "../hooks/useMonthlyHours";
import "./HoursPanel.css";

type Props = {
  stationId: string;
  year: number;
  month: number;
  onClose: () => void;
};

export default function HoursPanel({ stationId, year, month, onClose }: Props) {
  const { employees, loading: loadingEmp } = useEmployees(stationId);

  if (loadingEmp) {
    return (
      <div className="hours-panel">
        <div className="panel-header">
          <h2>Stundenübersicht</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <p>Lade Mitarbeiter…</p>
      </div>
    );
  }

  return (
    <div className="hours-panel">
      <div className="panel-header">
        <h2>Stundenübersicht</h2>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <table className="hours-table">
        <thead>
          <tr>
            <th>Mitarbeiter</th>
            <th>Stunden</th>
            <th>Max</th>
            <th>Diff</th>
          </tr>
        </thead>

        <tbody>
          {employees.map((emp) => {
            const { hours, loading } = useMonthlyHours(
              stationId,
              emp.id,
              year,
              month
            );

            if (loading) {
              return (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td colSpan={3}>Berechne…</td>
                </tr>
              );
            }

            const max = emp.max_hours ?? 0;
            const diff = hours - max;

            return (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{hours.toFixed(1)}</td>
                <td>{max}</td>
                <td
                  className={
                    diff > 0
                      ? "diff-over"
                      : diff < 0
                      ? "diff-under"
                      : "diff-neutral"
                  }
                >
                  {diff > 0 ? "+" : ""}
                  {diff.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
