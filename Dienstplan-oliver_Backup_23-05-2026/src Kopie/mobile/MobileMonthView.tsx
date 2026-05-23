// src/mobile/MobileMonthView.tsx
import { useState, useMemo } from "react";
import { generateCalendar } from "../calendar/calendarUtils";
import { useAssignments } from "../useAssignments";
import { getShiftModelForStation } from "../shiftModelsDefault";
import { isHoliday } from "../calendar/holidays";
import { useTouchNavigation } from "../useTouchNavigation";
import { useOverrides } from "../useOverrides";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  employees: Employee[];
};

export default function MobileMonthView({ stationName, employees }: Props) {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const safeStation = (stationName ?? "").toLowerCase();
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments } = useAssignments(safeStation);
  const { overrides } = useOverrides(safeStation);

  const weeks = useMemo(() => generateCalendar(year, month), [year, month]);

  const model = getShiftModelForStation(safeStation);

  useTouchNavigation({
    onSwipeLeft: () => setMonth((m) => (m === 11 ? 0 : m + 1)),
    onSwipeRight: () => setMonth((m) => (m === 0 ? 11 : m - 1)),
    onSwipeUp: () => window.scrollBy({ top: 300, behavior: "smooth" }),
    onSwipeDown: () => window.scrollBy({ top: -300, behavior: "smooth" })
  });

  const monthNames = [
    "Januar","Februar","März","April","Mai","Juni",
    "Juli","August","September","Oktober","November","Dezember"
  ];

  return (
    <div className="mobile-root">

      <h2 className="mobile-month-title">
        {monthNames[month]} {year}
      </h2>

      <button
        className="mobile-button"
        onClick={() => {
          setYear(today.getFullYear());
          setMonth(today.getMonth());
        }}
      >
        Heute
      </button>

      <div className="mobile-month-grid">

        <div className="mobile-month-header">Mo</div>
        <div className="mobile-month-header">Di</div>
        <div className="mobile-month-header">Mi</div>
        <div className="mobile-month-header">Do</div>
        <div className="mobile-month-header">Fr</div>
        <div className="mobile-month-header">Sa</div>
        <div className="mobile-month-header">So</div>

        {weeks.map((week) =>
          week.days.map((day) => {
            const iso = day.iso;
            const holiday = isHoliday(iso);

            const weekdayIndex = day.weekday;

            // ⭐ Standardmodell bestimmen
            let baseShifts: any[] = [];
            if (model) {
              if (holiday?.name) baseShifts = model.holiday;
              else if (weekdayIndex === 5) baseShifts = model.saturday;
              else if (weekdayIndex === 6) baseShifts = model.sunday;
              else baseShifts = model.weekdays;
            }

            // ⭐ Override anwenden
            const override = overrides[iso];
            const shiftList = override && override.length > 0
              ? override
              : baseShifts;

            return (
              <div
                key={iso}
                className={`mobile-month-cell ${
                  day.isOutsideMonth ? "mobile-month-outside" : ""
                } ${holiday?.name ? "mobile-month-holiday-bg" : ""}`}
              >
                <div className="mobile-month-day">{day.day}</div>

                {holiday?.name && (
                  <div className="mobile-month-holiday">{holiday.name}</div>
                )}

                <div className="mobile-month-shifts">
                  {shiftList.map((shift) => (
                    <div key={shift.name} className="mobile-month-shift">
                      <strong>{shift.name}</strong>
                      <span> {shift.start}–{shift.end}</span>

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
                              >
                                {emp.name}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
