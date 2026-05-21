// src/mobile/MobileMonthViewEmployee.tsx
import { useState, useMemo } from "react";
import { generateCalendar } from "../calendar/calendarUtils";
import type { CalendarWeek, CalendarDay } from "../calendar/calendarUtils";
import { isHoliday } from "../calendar/holidays";
import { useTouchNavigation } from "../useTouchNavigation";

export default function MobileMonthViewEmployee() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

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

        {weeks.map((week: CalendarWeek) =>
          week.days.map((day: CalendarDay) => {
            const holiday = isHoliday(day.iso);

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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
