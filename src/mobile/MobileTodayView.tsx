// src/mobile/MobileTodayView.tsx
import { useMemo } from "react";
import { useAssignments } from "../useAssignments";
import { shiftModelsDefault } from "../shiftModelsDefault";
import { getHolidayInfo } from "../calendar/calendarUtils";
import { useTouchNavigation } from "../useTouchNavigation";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  employees: Employee[];
  onOpenMonth: () => void;
};

export default function MobileTodayView({
  stationName,
  employees,
  onOpenMonth
}: Props) {
  const today = new Date();
  const iso = today.toISOString().split("T")[0];

  const safeStation = (stationName ?? "").toLowerCase();
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments } = useAssignments(safeStation);

  const model = shiftModelsDefault[safeStation];
  const holiday = getHolidayInfo(iso);

  // Mo=0 … So=6
  const weekdayIndex = (today.getDay() + 6) % 7;

  const shiftList = useMemo(() => {
    if (!model) return [];

    if (holiday?.name) return model.holiday;
    if (weekdayIndex === 5) return model.saturday;
    if (weekdayIndex === 6) return model.sunday;

    return model.weekdays;
  }, [holiday, weekdayIndex, model]);

  // Touch-Gesten (TS-sicher)
  useTouchNavigation({
    onSwipeUp: onOpenMonth,
    onSwipeLeft: undefined,
    onSwipeRight: undefined,
    onSwipeDown: () =>
      window.scrollBy({ top: -300, behavior: "smooth" })
  });

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag"
  ];

  return (
    <div className="mobile-today-root">

      {/* HEADER */}
      <h2 className="mobile-today-title">
        {weekdayNames[weekdayIndex]}, {today.getDate()}.{today.getMonth() + 1}.
        {today.getFullYear()}
      </h2>

      {/* FEIERTAG */}
      {holiday?.name && (
        <div className="mobile-today-holiday">
          🎉 {holiday.name}
        </div>
      )}

      {/* SCHICHTEN */}
      <div className="mobile-today-shifts">
        {shiftList.map((shift) => (
          <div key={shift.name} className="mobile-today-shift">
            <div className="mobile-today-shift-header">
              <strong>{shift.name}</strong>
              <span className="mobile-today-time">
                {shift.start} – {shift.end}
              </span>
            </div>

            <div className="mobile-today-emp-list">
              {assignments
                .filter(
                  (a) =>
                    a.date === iso &&
                    a.shift_name === shift.name &&
                    a.station_id === safeStation
                )
                .map((a) => {
                  const emp = safeEmployees.find((e) => e.id === a.employee_id);
                  if (!emp) return null;

                  return (
                    <div key={a.id} className="mobile-today-emp-pill">
                      {emp.name}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* BUTTON */}
      <button className="mobile-today-month-btn" onClick={onOpenMonth}>
        Monatsansicht öffnen
      </button>
    </div>
  );
}
