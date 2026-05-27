// src/utils/hoursUtils.ts
import { getShiftModelForStation } from "../shiftModelsDefault";
import { isHoliday } from "../calendar/holidays";
import { normalizeShiftName } from "./normalizeShiftName";

export type AssignmentLike = {
  date: string;          // "2025-01-15"
  shift_name: string;    // "Früh", "Früh 2", "Mittel", ...
  station_id: string;
  override_start_time?: string | null; // "06:00"
  override_end_time?: string | null;   // "12:00"
};

function getWeekdayIndex(date: Date): number {
  // Mo=0 … So=6
  return (date.getDay() + 6) % 7;
}

function parseTimeToHours(start: string, end: string): number {
  const s = new Date(`1970-01-01T${start}:00`);
  const e = new Date(`1970-01-01T${end}:00`);
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60);
  return Number(diff.toFixed(2));
}

export function calculateHoursForAssignments(
  stationId: string,
  assignments: AssignmentLike[]
): number {
  if (!stationId || !assignments || assignments.length === 0) return 0;

  const safeStation = (stationId ?? "").toLowerCase();
  const model = getShiftModelForStation(safeStation);

  let total = 0;

  for (const a of assignments) {
    const date = new Date(a.date);
    const iso = a.date;
    const holiday = isHoliday(iso);

    const weekdayIndex = getWeekdayIndex(date);
    const normalizedName = normalizeShiftName(a.shift_name);

if (
  safeStation === "seelbach" &&
  (normalizedName === "Ersatz 1" || normalizedName === "Ersatz 2")
) {
  continue;
}

    // passendes Schichtmodell wählen
    let shiftList = model.weekdays;
    if (holiday?.name) {
      shiftList = model.holiday;
    } else if (weekdayIndex === 5) {
      shiftList = model.saturday;
    } else if (weekdayIndex === 6) {
      shiftList = model.sunday;
    }

    const baseShift = shiftList.find(
      (s) => normalizeShiftName(s.name) === normalizedName
    );

    if (!baseShift) {
      console.warn("Kein Modell für Schicht:", stationId, iso, normalizedName);
      continue;
    }

    const startTime = a.override_start_time ?? baseShift.start;
    const endTime = a.override_end_time ?? baseShift.end;

    // Wenn irgendwas kein echtes Zeitformat ist, überspringen
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      console.warn("Ungültige Zeit:", startTime, endTime, a);
      continue;
    }

    total += parseTimeToHours(startTime, endTime);
  }

  return Number(total.toFixed(2));
}
