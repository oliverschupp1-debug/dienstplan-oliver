import { useMemo, useState } from "react";
import { useAssignments } from "../useAssignments";
import { useEmployees } from "../hooks/useEmployees";
import { useOverrides } from "../useOverrides";
import { isHoliday } from "../calendar/holidays";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { useTouchNavigation } from "../useTouchNavigation";

interface Props {
  stationName: string;
  employees: { id: string; name: string }[];
}

export default function MobileMonthViewAdmin({ stationName }: Props) {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [search, setSearch] = useState("");

  const safeStation = (stationName ?? "").toLowerCase();

  const shiftModel = getShiftModelForStation(safeStation);

  const { employees } = useEmployees(safeStation);
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments, addAssignment, removeAssignment } =
    useAssignments(safeStation);

  const { overrides, saveOverride } = useOverrides(safeStation);

  // overrides ist ein Record<string, any[]>
  const overridesMap = overrides;

  const filteredEmployees = useMemo(() => {
    return safeEmployees.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeEmployees, search]);

  // Kalender generieren
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));

    const result: { days: any[] }[] = [];
    let current = new Date(start);

    for (let w = 0; w < 6; w++) {
      const days: any[] = [];

      for (let d = 0; d < 7; d++) {
        const iso = current.toISOString().split("T")[0];

        days.push({
          iso,
          date: new Date(current),
          day: current.getDate(),
          outside: current.getMonth() !== month
        });

        current.setDate(current.getDate() + 1);
      }

      result.push({ days });
    }

    return result;
  }, [year, month]);

  // Touch-Gesten
  useTouchNavigation({
    onSwipeLeft: () =>
      setMonth((m) => {
        if (m === 11) {
          setYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      }),
    onSwipeRight: () =>
      setMonth((m) => {
        if (m === 0) {
          setYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      }),
    onSwipeUp: () => window.scrollBy({ top: 300, behavior: "smooth" }),
    onSwipeDown: () => window.scrollBy({ top: -300, behavior: "smooth" })
  });

  const [dragEmployee, setDragEmployee] = useState<string | null>(null);

  function onDragStart(empId: string) {
    setDragEmployee(empId);
  }

  function onDragEnd() {
    setDragEmployee(null);
  }

  function handleDrop(iso: string, shiftName: string, e: React.DragEvent) {
    e.currentTarget.classList.remove("mobile-drop-active");

    const existing = assignments.find(
      (a) =>
        a.date === iso &&
        a.shift_name === shiftName &&
        a.station_id === safeStation
    );

    if (existing) removeAssignment(existing.id);
    if (!dragEmployee) return;

    addAssignment({
      date: iso,
      shift_name: shiftName,
      employee_id: dragEmployee,
      station_id: safeStation
    });
  }

  function openOverrideEditor(iso: string) {
    const names = prompt(
      "Override setzen: Früh,Mittel,Spät (Komma getrennt) oder leer für Standard"
    );

    if (names === null) return;

    if (names.trim() === "") {
      saveOverride(iso, null);
      return;
    }

    const list = names.split(",").map((s) => s.trim());
    const base = shiftModel.weekdays;

    const newShifts = list
      .map((n) => base.find((s) => s.name === n))
      .filter(Boolean) as any[];

    saveOverride(iso, newShifts);
  }

  function deleteOverride(iso: string) {
    saveOverride(iso, null);
  }

  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  return (
    <div className="mobile-root">

      {/* HEADER */}
      <h2 className="mobile-month-title">
        {monthNames[month]} {year}
      </h2>

      {/* SUCHE */}
      <input
        type="text"
        placeholder="Mitarbeiter suchen…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mobile-search"
      />

      {/* MITARBEITERLISTE */}
      <div className="mobile-employee-list">
        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="mobile-month-emp-pill"
            draggable
            onDragStart={() => onDragStart(emp.id)}
            onDragEnd={onDragEnd}
          >
            {emp.name}
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="mobile-month-grid">

        {/* WEEKDAY HEADERS */}
        <div className="mobile-month-header">Mo</div>
        <div className="mobile-month-header">Di</div>
        <div className="mobile-month-header">Mi</div>
        <div className="mobile-month-header">Do</div>
        <div className="mobile-month-header">Fr</div>
        <div className="mobile-month-header">Sa</div>
        <div className="mobile-month-header">So</div>

        {/* DAYS */}
        {weeks.map((week) =>
          week.days.map((day) => {
            const iso = day.iso;
            const holiday = isHoliday(iso);
            const override = overridesMap[iso];

            const weekdayIndex = (day.date.getDay() + 6) % 7;

            const baseModel =
              weekdayIndex === 6
                ? shiftModel.sunday
                : weekdayIndex === 5
                ? shiftModel.saturday
                : shiftModel.weekdays;

            const model =
              override
                ? override
                : holiday?.name
                ? shiftModel.holiday
                : baseModel;

            return (
              <div
                key={iso}
                className={`
                  mobile-month-cell
                  ${day.outside ? "mobile-month-outside" : ""}
                  ${holiday?.name ? "mobile-month-holiday-bg" : ""}
                  ${override ? "mobile-month-override-bg" : ""}
                `}
                onDoubleClick={() => openOverrideEditor(iso)}
              >
                {/* TAG */}
                <div className="mobile-month-day">{day.day}</div>

                {/* FEIERTAG */}
                {holiday?.name && (
                  <div className="mobile-month-holiday">{holiday.name}</div>
                )}

                {/* OVERRIDE BADGE */}
                {override && (
                  <div className="mobile-month-override">Override</div>
                )}

                {/* SCHICHTEN */}
                <div className="mobile-month-shifts">
                  {model?.map((shift: any) => (
                    <div
                      key={shift.name}
                      className="mobile-month-shift"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("mobile-drop-active");
                      }}
                      onDragLeave={(e) =>
                        e.currentTarget.classList.remove("mobile-drop-active")
                      }
                      onDrop={(e) => handleDrop(iso, shift.name, e)}
                    >
                      <strong>{shift.name}</strong>

                      <div className="mobile-month-emp-list">
                        {assignments
                          .filter(
                            (a) =>
                              a.date === iso &&
                              a.shift_name === shift.name &&
                              a.station_id === safeStation
                          )
                          .map((a) => {
                            const emp = safeEmployees.find(
                              (e) => e.id === a.employee_id
                            );
                            if (!emp) return null;

                            return (
                              <div
                                key={a.id}
                                className="mobile-month-emp-pill"
                                draggable
                                onDragStart={() => onDragStart(emp.id)}
                                onDragEnd={onDragEnd}
                              >
                                {emp.name}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* OVERRIDE LÖSCHEN */}
                {override && (
                  <button
                    className="mobile-button danger small"
                    onClick={() => deleteOverride(iso)}
                  >
                    Override löschen
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
