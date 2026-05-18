// src/mobile/MobileMonthViewEmployee.tsx
import { useState, useMemo } from "react";
import { generateCalendar } from "../calendar/calendarUtils";
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
  onOpenToday?: () => void; // optional, damit Router nicht knallt
};

export default function MobileMonthViewEmployee({
  stationName,
  employees,
  onOpenToday
}: Props) {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const safeStation = (stationName ?? "").toLowerCase();
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const { assignments } = useAssignments(safeStation);

  const weeks = useMemo(() => generateCalendar(year, month), [year, month]);

  const model = shiftModelsDefault[safeStation];

  // Touch-Gesten
  useTouchNavigation({
    onSwipeLeft: () => setMonth((m) => (m === 11 ? 0 : m + 1)),
    onSwipeRight: () => setMonth((m) => (m === 0 ? 11 : m - 1)),
    onSwipeDown: onOpenToday
  });

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

      <button
        className="mobile-button"
        onClick={() => {
          setYear(today.getFullYear());
          setMonth(today.getMonth());
        }}
      >
        Heute
      </button>

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
            const holiday = getHolidayInfo(iso);

            const weekdayIndex = (day.date.getDay() + 6) % 7;

            let shiftList: any[] = [];
            if (model) {
              if (holiday?.name) shiftList = model.holiday;
              else if (weekdayIndex === 5) shiftList = model.saturday;
              else if (weekdayIndex === 6) shiftList = model.sunday;
              else shiftList = model.weekdays;
            }

            return (
              <div
                key={iso}
                className={`
                  mobile-month-cell
                  ${day.outside ? "mobile-month-outside" : ""}
                  ${holiday?.name ? "mobile-month-holiday-bg" : ""}
                `}
              >
                {/* TAG */}
                <div className="mobile-month-day">{day.day}</div>

                {/* FEIERTAG */}
                {holiday?.name && (
                  <div className="mobile-month-holiday">{holiday.name}</div>
                )}

                {/* SCHICHTEN */}
                <div className="mobile-month-shifts">
                  {shiftList.map((shift) => (
                    <div key={shift.name} className="mobile-month-shift">
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
                              <div key={a.id} className="mobile-month-emp-pill">
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
