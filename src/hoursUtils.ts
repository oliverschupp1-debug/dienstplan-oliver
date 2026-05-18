// hoursUtils.ts
// Berechnet Arbeitsstunden pro Mitarbeiter basierend auf Assignments + Schichtzeiten
// Jetzt 100% kompatibel mit Supabase, Feiertagen, Overrides und MonthCalendar

import type { StationShiftModel } from "./shiftModelsDefault";

export type Assignment = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  employee_id: string;
  shift_name: string;
  station_id: string;
};

export function diffHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  return (endMin - startMin) / 60;
}

export function calculateHours(
  assignments: Assignment[],
  shiftModel: StationShiftModel,
  selectedYear: number,
  selectedMonth: number // 0–11
): Record<string, number> {
  const result: Record<string, number> = {};

  // Monatsgrenzen bestimmen
  const monthStart = new Date(selectedYear, selectedMonth, 1);
  const monthEnd = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  for (const a of assignments) {
    // ISO sicher parsen
    const [y, m, d] = a.date.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    // Nur Schichten des sichtbaren Monats zählen
    if (date < monthStart || date > monthEnd) continue;

    const weekday = date.getDay();

    let shifts =
      weekday === 0
        ? shiftModel.sunday ?? []
        : weekday === 6
        ? shiftModel.saturday ?? []
        : shiftModel.weekdays ?? [];

    const shift = shifts.find((s) => s.name === a.shift_name);
    if (!shift) continue;

    const hours = diffHours(shift.start, shift.end);

    if (!result[a.employee_id]) {
      result[a.employee_id] = 0;
    }

    result[a.employee_id] += hours;
  }

  return result;
}
