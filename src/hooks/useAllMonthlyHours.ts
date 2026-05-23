// src/hooks/useAllMonthlyHours.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { calculateHoursForAssignments } from "../utils/hoursUtils";
import { normalizeShiftName } from "../utils/normalizeShiftName";

type Employee = {
  id: string;
  name: string | null;
};

type Assignment = {
  id: string;
  date: string;
  shift_name: string;
  station_id: string;
  employee_id: string;
  override_start_time?: string | null;
  override_end_time?: string | null;
};

type DayOverride = {
  id: number;
  date: string;
};

type OverrideShift = {
  override_id: number;
  name: string;
  start_time: string;
  end_time: string;
  employee: string | null;
};

function toLocalIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function duration(start: string, end: string) {
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return 0;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return Number(((endMinutes - startMinutes) / 60).toFixed(2));
}

export function useAllMonthlyHours(
  stationId: string | null,
  year: number,
  month: number,
  reloadFlag: number
) {
  const [hoursMap, setHoursMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!stationId) {
        setHoursMap({});
        setLoading(false);
        return;
      }

      setLoading(true);

      const firstDay = toLocalIso(new Date(year, month, 1));
      const lastDay = toLocalIso(new Date(year, month + 1, 0));

      const { data: employees } = await supabase
        .from("employees")
        .select("id, name")
        .eq("station_id", stationId);

      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (assignmentsError) {
        console.error("Fehler beim Laden der Assignments:", assignmentsError);
        if (!cancelled) {
          setHoursMap({});
          setLoading(false);
        }
        return;
      }

      const { data: dayOverrides } = await supabase
        .from("day_overrides")
        .select("id, date")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      const overrideIds = (dayOverrides ?? []).map((row) => row.id);

      let overrideShifts: OverrideShift[] = [];

      if (overrideIds.length > 0) {
        const { data } = await supabase
          .from("override_shifts")
          .select("override_id, name, start_time, end_time, employee")
          .in("override_id", overrideIds);

        overrideShifts = (data ?? []) as OverrideShift[];
      }

      const overrideDateById = new Map<number, string>();

      for (const row of (dayOverrides ?? []) as DayOverride[]) {
        overrideDateById.set(row.id, row.date);
      }

      const overrideTimeByDateAndShift = new Map<
        string,
        { start: string; end: string }
      >();

      for (const shift of overrideShifts) {
        const date = overrideDateById.get(shift.override_id);
        if (!date) continue;

        const key = `${date}|${normalizeShiftName(shift.name)}`;

        overrideTimeByDateAndShift.set(key, {
          start: shift.start_time,
          end: shift.end_time,
        });
      }

      const enhancedAssignments: Assignment[] = ((assignments ?? []) as Assignment[]).map(
        (assignment) => {
          const key = `${assignment.date}|${normalizeShiftName(
            assignment.shift_name
          )}`;

          const overrideTime = overrideTimeByDateAndShift.get(key);

          if (!overrideTime) return assignment;

          return {
            ...assignment,
            override_start_time: overrideTime.start,
            override_end_time: overrideTime.end,
          };
        }
      );

      const byEmployee: Record<string, Assignment[]> = {};

      for (const assignment of enhancedAssignments) {
        if (!byEmployee[assignment.employee_id]) {
          byEmployee[assignment.employee_id] = [];
        }

        byEmployee[assignment.employee_id].push(assignment);
      }

      const result: Record<string, number> = {};

      for (const [employeeId, list] of Object.entries(byEmployee)) {
        result[employeeId] = calculateHoursForAssignments(stationId, list);
      }

      const employeesByName = new Map<string, Employee>();

      for (const employee of (employees ?? []) as Employee[]) {
        if (employee.name) {
          employeesByName.set(employee.name.trim().toLowerCase(), employee);
        }
      }

      for (const shift of overrideShifts) {
        if (!shift.employee) continue;

        const employee = employeesByName.get(shift.employee.trim().toLowerCase());
        if (!employee) continue;

        const date = overrideDateById.get(shift.override_id);
        if (!date) continue;

        const alreadyHasAssignment = enhancedAssignments.some(
          (assignment) =>
            assignment.employee_id === employee.id &&
            assignment.date === date &&
            normalizeShiftName(assignment.shift_name) === normalizeShiftName(shift.name)
        );

        if (alreadyHasAssignment) continue;

        const hours = duration(shift.start_time, shift.end_time);
        result[employee.id] = Number(((result[employee.id] ?? 0) + hours).toFixed(2));
      }

      if (!cancelled) {
        setHoursMap(result);
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [stationId, year, month, reloadFlag]);

  return { hoursMap, loading };
}