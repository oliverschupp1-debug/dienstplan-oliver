// src/components/Sidebar/Sidebar.tsx
import { useEffect, useMemo, useState } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useAllMonthlyHours } from "../../hooks/useAllMonthlyHours";
import { supabase } from "../../lib/supabaseClient";
import { onAssignmentsChanged } from "../../events";
import { useAppStore } from "../../store/useAppStore";
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
  month,
}: SidebarProps) {
  const role = useAppStore((s) => s.role);
  const userName = useAppStore((s) => s.userName);

  const canManageEmployees = role === "admin" || role === "planner";
  const canChangeStation = role === "admin";
  const showEmployeeList = role !== "employee";

  const { employees, loading, reload } = useEmployees(
    showEmployeeList ? stationId : null
  );

  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    const off = onAssignmentsChanged(() => {
      setReloadFlag((x) => x + 1);
    });

    return () => {
      off();
    };
  }, []);

  const { hoursMap, loading: hoursLoading } = useAllMonthlyHours(
    showEmployeeList ? stationId : null,
    year,
    month,
    reloadFlag
  );

  const selectedStationName = useMemo(() => {
    return stations.find((s) => s.id === stationId)?.name ?? stationId ?? "";
  }, [stationId, stations]);

  const [newName, setNewName] = useState("");
  const [newMaxHours, setNewMaxHours] = useState("43");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!canManageEmployees) return;

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
      role: "employee",
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
    if (!canManageEmployees) return;

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
    <aside className="sidebar">
      <h2 className="sidebar-title">
        {role === "employee" ? `Hallo ${userName ?? ""} :-)` : "Mitarbeiter"}
      </h2>

      <div className="station-select-block">
        <label className="station-label">Station</label>

        {canChangeStation ? (
          <select
            className="station-select"
            value={stations.some((s) => s.id === stationId) ? stationId ?? "" : ""}
            onChange={(e) => onStationChange(e.target.value)}
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="station-readonly">{selectedStationName || "Keine Station"}</div>
        )}
      </div>

      {role === "employee" && (
        <div className="employee-sidebar-note">
          Du siehst nur deine eigene Station und deinen Dienstplan.
        </div>
      )}

      {showEmployeeList && loading && (
        <div className="loading">Lade Mitarbeiter…</div>
      )}

      {showEmployeeList && (
        <div className="employee-list">
          {employees.map((emp) => {
            const hours = hoursMap[emp.id] ?? 0;
            const max = emp.max_hours ?? 0;
            const remaining = max - hours;

            return (
              <div
                key={emp.id}
                className="employee-item"
                draggable={canManageEmployees}
                onDragStart={(e) => {
                  if (!canManageEmployees) return;
                  e.dataTransfer.setData(
                    "text/plain",
                    JSON.stringify({ employeeId: emp.id })
                  );
                }}
              >
                <div className="employee-avatar">
                  {emp.name?.charAt(0)?.toUpperCase()}
                </div>

                <div className="employee-info">
                  <div className="employee-name">{emp.name}</div>

                  {hoursLoading ? (
                    <div className="employee-hours">Berechne…</div>
                  ) : (
                    <div className="employee-hours">
                      <span>
                        {hours.toFixed(1)} / {max} Std/Monat
                      </span>

                      <span
                        className={
                          remaining < 0
                            ? "hours-over"
                            : remaining > 0
                            ? "hours-under"
                            : "hours-neutral"
                        }
                      >
                        {remaining >= 0 ? `${remaining.toFixed(1)} frei` : `${Math.abs(remaining).toFixed(1)} drüber`}
                      </span>
                    </div>
                  )}
                </div>

                {canManageEmployees && (
                  <button
                    className="employee-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(emp.id, emp.name);
                    }}
                    aria-label={`${emp.name} löschen`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManageEmployees && (
        <form className="add-employee-form" onSubmit={handleAddEmployee}>
          <div className="add-employee-label">Neuer Mitarbeiter</div>

          <input
            type="text"
            className="add-employee-input"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <input
            type="number"
            className="add-employee-input"
            placeholder="Max. Stunden/Monat"
            value={newMaxHours}
            onChange={(e) => setNewMaxHours(e.target.value)}
          />

          {errorMsg && <div className="add-employee-error">{errorMsg}</div>}

          <button className="add-employee-btn" type="submit" disabled={saving}>
            {saving ? "Speichere…" : "+ Mitarbeiter hinzufügen"}
          </button>
        </form>
      )}
    </aside>
  );
}
