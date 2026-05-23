// src/mobile/MobileMonthViewEmployee.tsx
import { useMemo, useState } from "react";
import { generateCalendar } from "../calendar/calendarUtils";
import type { CalendarWeek, CalendarDay } from "../calendar/calendarUtils";
import { isHoliday } from "../calendar/holidays";
import { useAssignments } from "../useAssignments";
import { useTouchNavigation } from "../useTouchNavigation";

type Employee = {
  id: string;
  name: string;
};

type Props = {
  stationName: string;
  employees: Employee[];
};

export default function MobileMonthViewEmployee({ stationName, employees }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const safeStation = (stationName ?? "").toLowerCase();
  const { assignments } = useAssignments(safeStation);

  const weeks: CalendarWeek[] = useMemo(
    () => generateCalendar(year, month),
    [year, month]
  );

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

      {/* ⭐ Sticky Monatsname */}
      <h2 className="mobile-month-title sticky-month">
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

      {/* ⭐ Sticky Wochentagsleiste */}
      <div className="mobile-month-header-row sticky-weekdays">
        <div>Mo</div>
        <div>Di</div>
        <div>Mi</div>
        <div>Do</div>
        <div>Fr</div>
        <div>Sa</div>
        <div>So</div>
      </div>

      {/* ⭐ Grid */}
      <div className="mobile-month-grid">
        {weeks.map((week: CalendarWeek) =>
          week.days.map((day: CalendarDay) => {
            const holiday = isHoliday(day.iso);

            const todaysAssignments = assignments.filter(
              (a) =>
                a.date === day.iso &&
                a.station_id === safeStation
            );

            return (
              <div
                key={day.iso}
                className={`mobile-month-cell ${
                  day.isOutsideMonth ? "mobile-month-outside" : ""
                } ${holiday?.name ? "mobile-month-holiday-bg" : ""}`}
              >
                <div className="mobile-month-day">{day.day}</div>

                {holiday?.name && (
                  <div className="mobile-month-holiday">{holiday.name}</div>
                )}

                <div className="mobile-month-emp-list">
                  {todaysAssignments.map((a) => {
                    const emp = employees.find((e) => e.id === a.employee_id);
                    if (!emp) return null;

                    return (
                      <div key={a.id} className="mobile-month-emp-pill">
                        {emp.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
