// src/components/Sidebar/Sidebar.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useAllMonthlyHours } from "../../hooks/useAllMonthlyHours";
import { useAbsences } from "../../hooks/useAbsences";
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

type EmployeeDraft = {
  max_hours: string;
  remarks: string;
  vacation_days_total: string;
  vacation_note: string;
};

type AbsenceDraft = {
  start_date: string;
  end_date: string;
  type: "vacation" | "sick" | "unavailable";
  note: string;
};

function countVacationDaysInYear(
  startDate: string,
  endDate: string,
  targetYear: number
): number {
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);

  const start = new Date(startDate);
  const end = new Date(endDate);

  const clippedStart = start > yearStart ? start : yearStart;
  const clippedEnd = end < yearEnd ? end : yearEnd;

  if (clippedEnd < clippedStart) return 0;

  let count = 0;
  const current = new Date(clippedStart);

  while (current <= clippedEnd) {
    count += 1;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function absenceLabel(type: string) {
  if (type === "vacation") return "Urlaub";
  if (type === "sick") return "Krank";
  return "Abwesend";
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

  const { employees, reload } = useEmployees(
    showEmployeeList ? effectiveStationId : null
  );

  const { absences, createAbsence, deleteAbsence } =
    useAbsences(effectiveStationId);

  const visibleEmployees = employees.filter((emp) => emp.role !== "admin");

  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null
  );

  const [reloadFlag, setReloadFlag] = useState(0);

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMaxHours, setNewMaxHours] = useState("43");

  const [saving, setSaving] = useState(false);
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [employeeDrafts, setEmployeeDrafts] = useState<
    Record<string, EmployeeDraft>
  >({});

  const [absenceDrafts, setAbsenceDrafts] = useState<
    Record<string, AbsenceDraft>
  >({});

  useEffect(() => {
    const nextDrafts: Record<string, EmployeeDraft> = {};
    const nextAbsenceDrafts: Record<string, AbsenceDraft> = {};

    for (const emp of visibleEmployees) {
      nextDrafts[emp.id] = {
        max_hours: String(emp.max_hours ?? 0),
        remarks: emp.remarks ?? "",
        vacation_days_total: String(emp.vacation_days_total ?? 0),
        vacation_note: emp.vacation_note ?? "",
      };

      nextAbsenceDrafts[emp.id] = {
        start_date: "",
        end_date: "",
        type: "vacation",
        note: "",
      };
    }

    setEmployeeDrafts(nextDrafts);
    setAbsenceDrafts(nextAbsenceDrafts);
  }, [employees]);

  useEffect(() => {
    const off = onAssignmentsChanged(() => {
      setReloadFlag((x) => x + 1);
      reload();
    });

    return () => {
      off();
    };
  }, [reload]);

  const { hoursMap } = useAllMonthlyHours(
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

  function updateDraft(employeeId: string, patch: Partial<EmployeeDraft>) {
    setEmployeeDrafts((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        ...patch,
      },
    }));
  }

  function updateAbsenceDraft(
    employeeId: string,
    patch: Partial<AbsenceDraft>
  ) {
    setAbsenceDrafts((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        ...patch,
      },
    }));
  }

  function getVacationUsed(employeeId: string) {
    return absences
      .filter(
        (absence) =>
          absence.employee_id === employeeId && absence.type === "vacation"
      )
      .reduce(
        (sum, absence) =>
          sum +
          countVacationDaysInYear(absence.start_date, absence.end_date, year),
        0
      );
  }

  async function handleCreateAbsence(employeeId: string) {
    const draft = absenceDrafts[employeeId];
    if (!draft) return;

    if (!draft.start_date || !draft.end_date) {
      alert("Bitte Start- und Enddatum auswählen.");
      return;
    }

    if (!effectiveStationId) return;

    try {
      await createAbsence({
        employee_id: employeeId,
        station_id: effectiveStationId,
        start_date: draft.start_date,
        end_date: draft.end_date,
        type: draft.type,
        note: draft.note,
      });

      setAbsenceDrafts((current) => ({
        ...current,
        [employeeId]: {
          start_date: "",
          end_date: "",
          type: "vacation",
          note: "",
        },
      }));
    } catch {
      alert("Abwesenheit konnte nicht gespeichert werden.");
    }
  }

  async function handleSaveEmployeeSettings(employeeId: string) {
    const draft = employeeDrafts[employeeId];
    if (!draft) return;

    const maxHours = Number(draft.max_hours);
    const vacationDaysTotal = Number(draft.vacation_days_total);

    setSavingEmployeeId(employeeId);

    const { error } = await supabase
      .from("employees")
      .update({
        max_hours: maxHours,
        remarks: draft.remarks.trim() || null,
        vacation_days_total: vacationDaysTotal,
        vacation_note: draft.vacation_note.trim() || null,
      })
      .eq("id", employeeId);

    if (error) {
      console.error(error);
      alert("Mitarbeiterdaten konnten nicht gespeichert werden.");
      setSavingEmployeeId(null);
      return;
    }

    await reload();
    setReloadFlag((x) => x + 1);
    setSavingEmployeeId(null);
  }

  async function handleAddEmployee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

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
      vacation_days_total: 0,
      vacation_note: null,
      auth_user_id: null,
      role: "employee",
    });

    if (error) {
      console.error(error);
      setErrorMsg("Mitarbeiter konnte nicht gespeichert werden.");
      setSaving(false);
      return;
    }

    setNewName("");
    setNewMaxHours("43");
    setShowAddEmployeeModal(false);

    await reload();
    setReloadFlag((x) => x + 1);
    setSaving(false);
  }

  async function handleDeleteEmployee(id: string, name?: string | null) {
    const displayName = name || "diesen Mitarbeiter";

    const ok = confirm(`Mitarbeiter "${displayName}" wirklich löschen?`);
    if (!ok) return;

    const { error } = await supabase.from("employees").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Fehler beim Löschen.");
      return;
    }

    await reload();
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

      {canManageEmployees && effectiveStationId && (
        <button
          type="button"
          className="add-employee-floating-btn"
          onClick={() => setShowAddEmployeeModal(true)}
        >
          + Mitarbeiter hinzufügen
        </button>
      )}

      {showEmployeeList && (
        <div className="employee-list">
          {visibleEmployees.map((emp) => {
            const hours = hoursMap[emp.id] ?? 0;
            const max = emp.max_hours ?? 0;
            const remaining = max - hours;
            const employeeName = emp.name || "Ohne Namen";
            const draft = employeeDrafts[emp.id];
            const absenceDraft = absenceDrafts[emp.id];
            const vacationTotal = emp.vacation_days_total ?? 0;
            const vacationUsed = getVacationUsed(emp.id);
            const vacationRemaining = vacationTotal - vacationUsed;
            const employeeAbsences = absences.filter(
              (absence) => absence.employee_id === emp.id
            );
            const expanded = expandedEmployeeId === emp.id;

            return (
              <div
                key={emp.id}
                className="employee-item employee-item-expandable"
              >
                <div
                  className="employee-header"
                  draggable={canManageEmployees}
                  onDragStart={(e) => {
                    if (!canManageEmployees) return;

                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify({ employeeId: emp.id })
                    );
                  }}
                  onClick={() =>
                    setExpandedEmployeeId(expanded ? null : emp.id)
                  }
                >
                  <div className="employee-avatar">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>

                  <div className="employee-info">
                    <div className="employee-name">{employeeName}</div>

                    <div className="employee-hours">
                      <span>
                        {hours.toFixed(2)} / {max.toFixed(2)} Std
                      </span>

                      <span
                        className={
                          remaining < 0 ? "hours-over" : "hours-under"
                        }
                      >
                        {remaining.toFixed(2)} frei
                      </span>
                    </div>

                    <div className="employee-hours">
                      <span>
                        Urlaub: {vacationUsed.toFixed(1)} /{" "}
                        {vacationTotal.toFixed(1)}
                      </span>

                      <span className="hours-under">
                        {vacationRemaining.toFixed(1)} offen
                      </span>
                    </div>
                  </div>

                  <div className="employee-expand-indicator">
                    {expanded ? "−" : "+"}
                  </div>
                </div>

                {expanded && draft && absenceDraft && (
                  <div className="employee-expanded-content">
                    <div className="employee-edit-box">
                      <label>
                        Max. Stunden
                        <input
                          type="number"
                          value={draft.max_hours}
                          onChange={(e) =>
                            updateDraft(emp.id, {
                              max_hours: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        Jahresurlaub
                        <input
                          type="number"
                          value={draft.vacation_days_total}
                          onChange={(e) =>
                            updateDraft(emp.id, {
                              vacation_days_total: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        Bemerkungen / Verfügbarkeit
                        <textarea
                          value={draft.remarks}
                          onChange={(e) =>
                            updateDraft(emp.id, {
                              remarks: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        Urlaubsnotiz
                        <textarea
                          value={draft.vacation_note}
                          onChange={(e) =>
                            updateDraft(emp.id, {
                              vacation_note: e.target.value,
                            })
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="add-employee-btn"
                        disabled={savingEmployeeId === emp.id}
                        onClick={() => handleSaveEmployeeSettings(emp.id)}
                      >
                        {savingEmployeeId === emp.id
                          ? "Speichere…"
                          : "Speichern"}
                      </button>
                    </div>

                    <div className="absence-box">
                      <h4>Abwesenheit eintragen</h4>

                      <div className="absence-form-grid">
                        <input
                          type="date"
                          value={absenceDraft.start_date}
                          onChange={(e) =>
                            updateAbsenceDraft(emp.id, {
                              start_date: e.target.value,
                            })
                          }
                        />

                        <input
                          type="date"
                          value={absenceDraft.end_date}
                          onChange={(e) =>
                            updateAbsenceDraft(emp.id, {
                              end_date: e.target.value,
                            })
                          }
                        />

                        <select
                          value={absenceDraft.type}
                          onChange={(e) =>
                            updateAbsenceDraft(emp.id, {
                              type: e.target.value as AbsenceDraft["type"],
                            })
                          }
                        >
                          <option value="vacation">Urlaub</option>
                          <option value="sick">Krank</option>
                          <option value="unavailable">Abwesend</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Notiz"
                          value={absenceDraft.note}
                          onChange={(e) =>
                            updateAbsenceDraft(emp.id, {
                              note: e.target.value,
                            })
                          }
                        />
                      </div>

                      <button
                        type="button"
                        className="add-employee-btn"
                        onClick={() => handleCreateAbsence(emp.id)}
                      >
                        Abwesenheit speichern
                      </button>

                      <div className="absence-list-sidebar">
                        {employeeAbsences.map((absence) => (
                          <div
                            key={absence.id}
                            className={`absence-pill absence-${absence.type}`}
                          >
                            <div>
                              <strong>{absenceLabel(absence.type)}</strong>

                              <div>
                                {absence.start_date} → {absence.end_date}
                              </div>

                              {absence.note && <div>{absence.note}</div>}
                            </div>

                            <button
                              type="button"
                              className="absence-delete-btn"
                              onClick={() => deleteAbsence(absence.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      className="employee-delete-btn-inline"
                      type="button"
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                    >
                      Mitarbeiter löschen
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddEmployeeModal && (
        <div
          className="add-employee-modal-backdrop"
          onClick={() => setShowAddEmployeeModal(false)}
        >
          <form
            className="add-employee-modal"
            onSubmit={handleAddEmployee}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="add-employee-modal-header">
              <h3>Neuer Mitarbeiter</h3>

              <button
                type="button"
                className="add-employee-modal-close"
                onClick={() => setShowAddEmployeeModal(false)}
              >
                ×
              </button>
            </div>

            <input
              type="text"
              className="add-employee-input"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
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
              {saving ? "Speichere…" : "Mitarbeiter speichern"}
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}