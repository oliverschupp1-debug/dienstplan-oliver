// hoursUtils.ts
// Berechnet Arbeitsstunden pro Mitarbeiter basierend auf Assignments + Schichtzeiten

import { StationShiftModel } from "./shiftModelsDefault";

export type Assignment = {
  id: string;
  date: string; // ISO YYYY-MM-DD
  employeeId: string;
  shift_name: string;
  station: string;
};

export type EmployeeHours = {
  employeeId: string;
  hours: number;
};

function diffHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  return (endMin - startMin) / 60;
}

export function calculateHours(
  assignments: Assignment[],
  shiftModel: StationShiftModel
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const a of assignments) {
    const date = new Date(a.date);
    const weekday = date.getDay(); // hier reicht JS-Tag, Schichtmodell ist fix

    let shifts: { name: string; start: string; end: string }[] = [];

    if (weekday === 0) {
      shifts = shiftModel.sunday;
    } else if (weekday === 6) {
      shifts = shiftModel.saturday;
    } else {
      shifts = shiftModel.weekdays;
    }

    const shift = shifts.find((s) => s.name === a.shift_name);
    if (!shift) continue;

    const hours = diffHours(shift.start, shift.end);

    if (!result[a.employeeId]) {
      result[a.employeeId] = 0;
    }

    result[a.employeeId] += hours;
  }

  return result;
}
