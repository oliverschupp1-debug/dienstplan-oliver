// src/mobile/MobileTodayView.tsx
import { useMemo } from "react";
import { useAssignments } from "../useAssignments";
import { getShiftModelForStation } from "../shiftModelsDefault";
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

function getLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MobileTodayView({
  stationName,
  employees,
  onOpenMonth,
}: Props) {
  const today = new Date();
  const iso = getLocalISO(today);

  const safeStation = (stationName ?? "").toLowerCase();
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments } = useAssignments(safeStation);

  const model = getShiftModelForStation(safeStation);
  const holiday = getHolidayInfo(iso);

  const weekdayIndex = (today.getDay() + 6) % 7;

  const shiftList = useMemo(() => {
    if (!model) return [];

    if (holiday?.name) return model.holiday;
    if (weekdayIndex === 5) return model.saturday;
    if (weekdayIndex === 6) return model.sunday;

    return model.weekdays;
  }, [holiday, weekdayIndex, model]);

  useTouchNavigation({
    onSwipeUp: onOpenMonth,
    onSwipeLeft: undefined,
    onSwipeRight: undefined,
    onSwipeDown: () =>
      window.scrollBy({ top: -300, behavior: "smooth" }),
  });

  const weekdayNames = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ];

  return (
    <div className="mobile-today-root">
      <h2 className="mobile-today-title">
        {weekdayNames[weekdayIndex]}, {today.getDate()}.{today.getMonth() + 1}.
        {today.getFullYear()}
      </h2>

      {holiday?.name && (
        <div className="mobile-today-holiday">🎉 {holiday.name}</div>
      )}

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

      <button className="mobile-today-month-btn" onClick={onOpenMonth}>
        Monatsansicht öffnen
      </button>
    </div>
  );
}
