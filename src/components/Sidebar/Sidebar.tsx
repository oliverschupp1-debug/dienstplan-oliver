console.log("SIDEBAR VERSION DARK + DELETE");

import { useState, useEffect } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useAllMonthlyHours } from "../../hooks/useAllMonthlyHours";
import { supabase } from "../../lib/supabaseClient";
import { onAssignmentsChanged } from "../../events";
import "./Sidebar.css";

interface SidebarProps {
  stationId: string | null;
  stations: { id: string; name: string }[];
  onStationChange: (id: string) => void;
  year: number;
  month: number;
}

export default function Sidebar({
  stationId,
  stations,
  onStationChange,
  year,
  month
}: SidebarProps) {
  const { employees, loading, reload } = useEmployees(stationId);

  const [reloadFlag, setReloadFlag] = useState(0);

  // ⭐ FIX: Kein Cleanup, kein boolean-Return
  useEffect(() => {
    onAssignmentsChanged(() => {
      setReloadFlag((x) => x + 1);
    });
  }, []);

  const { hoursMap, loading: hoursLoading } = useAllMonthlyHours(
    stationId,
    year,
    month,
    reloadFlag
  );

  const [newName, setNewName] = useState("");
  const [newMaxHours, setNewMaxHours] = useState("43");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!stationId) {
      setErrorMsg("Keine Station ausgewählt.");
      return;
    }

    if (!newName.trim()) {
      setErrorMsg("Bitte einen Namen eingeben.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("employees").insert({
      name: newName.trim(),
      station_id: stationId,
      max_hours: Number(newMaxHours) || 0,
      remarks: null,
      auth_user_id: null,
      role: null
    });

    if (error) {
      console.error("Fehler beim Anlegen des Mitarbeiters:", error);
      setErrorMsg("Mitarbeiter konnte nicht gespeichert werden.");
    } else {
      setNewName("");
      setNewMaxHours("43");
      reload();
    }

    setSaving(false);
  }

  async function handleDeleteEmployee(id: string, name: string) {
    const ok = confirm(`Mitarbeiter "${name}" wirklich löschen?`);
    if (!ok) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen.");
      return;
    }

    reload();
  }

  return (
    <div className="sidebar-dark">
      <div className="station-select-block-dark">
        <label className="station-label-dark">Station</label>
        <select
          className="station-select-dark"
          value={stations.some((s) => s.id === stationId) ? stationId ?? "" : ""}
          onChange={(e) => onStationChange(e.target.value)}
        >
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="sidebar-title-dark">Mitarbeiter</h2>

      {loading && <div className="loading-dark">Lade Mitarbeiter…</div>}

      <div className="employee-list-dark">
        {employees.map((emp) => {
          const hours = hoursMap[emp.id] ?? 0;
          const max = emp.max_hours ?? 0;
          const diff = hours - max;

          return (
            <div
              key={emp.id}
              className="employee-item-dark"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("employeeId", emp.id);
              }}
            >
              <div className="employee-avatar-dark">
                {emp.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="employee-info-dark">
                <div className="employee-name-dark">{emp.name}</div>

                {hoursLoading ? (
                  <div className="employee-hours-dark">Berechne…</div>
                ) : (
                  <div className="employee-hours-dark">
                    <span>
                      {hours.toFixed(1)} / {max} Std/Monat
                    </span>

                    <span
                      className={
                        diff > 0
                          ? "hours-over"
                          : diff < 0
                          ? "hours-under"
                          : "hours-neutral"
                      }
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <button
                className="employee-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEmployee(emp.id, emp.name);
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <form className="add-employee-form-dark" onSubmit={handleAddEmployee}>
        <div className="add-employee-label-dark">Neuer Mitarbeiter</div>

        <input
          type="text"
          className="add-employee-input-dark"
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />

        <input
          type="number"
          className="add-employee-input-dark"
          placeholder="Max. Stunden/Monat"
          value={newMaxHours}
          onChange={(e) => setNewMaxHours(e.target.value)}
        />

        {errorMsg && (
          <div className="add-employee-error-dark">{errorMsg}</div>
        )}

        <button className="add-employee-btn-dark" type="submit" disabled={saving}>
          {saving ? "Speichere…" : "+ Mitarbeiter hinzufügen"}
        </button>
      </form>
    </div>
  );
}
