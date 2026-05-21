// src/calendar/calendarUtils.ts
import { isHoliday } from "./holidays";

export type CalendarDay = {
  date: Date;
  iso: string;
  day: number;
  weekday: number; // 0 = Montag … 6 = Sonntag
  isOutsideMonth: boolean;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string;
};

export type CalendarWeek = {
  weekNumber: number;
  days: CalendarDay[];
};

// ISO‑Datum ohne UTC-Verschiebung
function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ISO‑8601 KW-Berechnung
function getISOWeek(date: Date): number {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
}

// Montag-basierter Wochentag (0=Mo,...,6=So)
function getMondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function generateCalendar(year: number, month: number): CalendarWeek[] {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Start: Montag der Woche, in der der 1. liegt
  const start = new Date(firstOfMonth);
  const startWeekday = getMondayBasedWeekday(start);
  start.setDate(start.getDate() - startWeekday);

  // Ende: Sonntag der Woche, in der der letzte Tag liegt
  const end = new Date(lastOfMonth);
  const endWeekday = getMondayBasedWeekday(end);
  end.setDate(end.getDate() + (6 - endWeekday));

  const weeks: CalendarWeek[] = [];
  let current = new Date(start);

  while (current <= end) {
    const weekDays: CalendarDay[] = [];
    const weekRef = new Date(current);
    const weekNumber = getISOWeek(weekRef);

    for (let i = 0; i < 7; i++) {
      const d = new Date(current);
      const iso = toISODate(d);
      const weekday = getMondayBasedWeekday(d);
      const isToday = iso === toISODate(new Date());

      const { holiday, name } = isHoliday(iso);

      weekDays.push({
        date: d,
        iso,
        day: d.getDate(),
        weekday,
        isOutsideMonth: d.getMonth() !== month,
        isToday,
        isSaturday: weekday === 5,
        isSunday: weekday === 6,
        isHoliday: holiday,
        holidayName: name ?? undefined
      });

      current.setDate(current.getDate() + 1);
    }

    weeks.push({
      weekNumber,
      days: weekDays
    });
  }

  return weeks;
}
