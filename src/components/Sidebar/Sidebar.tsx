// src/components/Sidebar/Sidebar.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  const showEmployeeList = role === "admin" || role === "planner";

  const effectiveStationId = stationId || null;

  const { employees, loading, reload } = useEmployees(
    showEmployeeList ? effectiveStationId : null
  );

  const [reloadFlag, setReloadFlag] = useState(0);
  const [newName, setNewName] = useState("");
  const [newMaxHours, setNewMaxHours] = useState("43");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const off = onAssignmentsChanged(() => {
      setReloadFlag((x) => x + 1);
      reload();
    });

    return () => off();
  }, [reload]);

  const { hoursMap, loading: hoursLoading } = useAllMonthlyHours(
    showEmployeeList ? effectiveStationId : null,
    year,
    month,
    reloadFlag
  );

  const selectedStationName = useMemo(() => {
    if (!effectiveStationId) return "";
    return (
      stations.find((station) => station.id === effectiveStationId)?.name ??
      effectiveStationId
    );
  }, [effectiveStationId, stations]);

  async function handleAddEmployee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    if (!canManageEmployees) return;

    if (!effectiveStationId) {
      setErrorMsg("Keine Station ausgewählt.");
      return;
    }

    const cleanName = newName.trim();

    if (!cleanName) {
      setErrorMsg("Bitte einen Namen eingeben.");
      return;
    }

    const maxHours = Number(newMaxHours);

    if (!Number.isFinite(maxHours) || maxHours < 0) {
      setErrorMsg("Bitte eine gültige maximale Stundenzahl eingeben.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("employees").insert({
      name: cleanName,
      station_id: effectiveStationId,
      max_hours: maxHours,
      remarks: null,
      auth_user_id: null,
      role: "employee",
    });

    if (error) {
      console.error("Fehler beim Anlegen des Mitarbeiters:", error);
      setErrorMsg("Mitarbeiter konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewName("");
    setNewMaxHours("43");
    reload();
    setReloadFlag((x) => x + 1);
    setSaving(false);
  }

  async function handleDeleteEmployee(id: string, name?: string | null) {
    if (!canManageEmployees) return;

    const displayName = name || "diesen Mitarbeiter";
    const ok = confirm(`Mitarbeiter "${displayName}" wirklich löschen?`);
    if (!ok) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen.");
      return;
    }

    reload();
    setReloadFlag((x) => x + 1);
  }

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">
        {role === "employee"
          ? `Hallo ${userName || "Nutzer"} :-)`
          : "Mitarbeiter"}
      </h2>

      <div className="station-select-block">
        <label className="station-label">Station</label>

        {canChangeStation ? (
          <select
            className="station-select"
            value={effectiveStationId ?? ""}
            onChange={(e) => onStationChange(e.target.value)}
          >
            <option value="" disabled>
              Station auswählen
            </option>

            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="station-readonly">
            {selectedStationName || "Keine Station"}
          </div>
        )}
      </div>

      {role === "employee" && (
        <div className="employee-sidebar-note">
          Du siehst nur deine eigene Station und deinen Dienstplan.
        </div>
      )}

      {showEmployeeList && !effectiveStationId && (
        <div className="loading">Bitte zuerst eine Station auswählen.</div>
      )}

      {showEmployeeList && effectiveStationId && loading && (
        <div className="loading">Lade Mitarbeiter…</div>
      )}

      {showEmployeeList && effectiveStationId && !loading && (
        <div className="employee-list">
          {employees.length === 0 && (
            <div className="loading">Keine Mitarbeiter gefunden.</div>
          )}

          {employees.map((emp) => {
            const hours = hoursMap[emp.id] ?? 0;
            const max = emp.max_hours ?? 0;
            const remaining = max - hours;
            const employeeName = emp.name || "Ohne Namen";

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
                  {employeeName.charAt(0).toUpperCase()}
                </div>

                <div className="employee-info">
                  <div className="employee-name">{employeeName}</div>

                  {hoursLoading ? (
                    <div className="employee-hours">Berechne…</div>
                  ) : (
                    <div className="employee-hours">
                      <span>
                        {hours.toFixed(2)} / {max} Std/Monat
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
                        {remaining >= 0
                          ? `${remaining.toFixed(2)} frei`
                          : `${Math.abs(remaining).toFixed(2)} drüber`}
                      </span>
                    </div>
                  )}
                </div>

                {canManageEmployees && (
                  <button
                    className="employee-delete-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEmployee(emp.id, emp.name);
                    }}
                    aria-label={`${employeeName} löschen`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManageEmployees && effectiveStationId && (
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
            min="0"
            step="0.5"
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