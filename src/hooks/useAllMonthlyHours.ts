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
  station_id: string;
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

      const { data: stationEmployees } = await supabase
        .from("employees")
        .select("id, name")
        .eq("station_id", stationId);

      const { data: accessRows } = await supabase
        .from("employee_station_access")
        .select("employee_id, station_id")
        .eq("station_id", stationId);

      const extraEmployeeIds = (accessRows ?? [])
        .map((row) => row.employee_id as string)
        .filter(Boolean);

      let extraEmployees: Employee[] = [];

      if (extraEmployeeIds.length > 0) {
        const { data } = await supabase
          .from("employees")
          .select("id, name")
          .in("id", extraEmployeeIds);

        extraEmployees = (data ?? []) as Employee[];
      }

      const visibleEmployees = [
        ...((stationEmployees ?? []) as Employee[]),
        ...extraEmployees,
      ];

      const visibleEmployeeIds = Array.from(
        new Set(visibleEmployees.map((employee) => employee.id))
      );

      if (visibleEmployeeIds.length === 0) {
        if (!cancelled) {
          setHoursMap({});
          setLoading(false);
        }
        return;
      }

      const { data: employeeAccessRows } = await supabase
        .from("employee_station_access")
        .select("employee_id, station_id")
        .in("employee_id", visibleEmployeeIds);

      const relevantStationIds = Array.from(
        new Set([
          stationId,
          ...((employeeAccessRows ?? []).map(
            (row) => row.station_id as string
          ) ?? []),
        ])
      );

      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .in("station_id", relevantStationIds)
        .in("employee_id", visibleEmployeeIds)
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
        .select("id, date, station_id")
        .in("station_id", relevantStationIds)
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

      const overrideInfoById = new Map<
        number,
        { date: string; stationId: string }
      >();

      for (const row of (dayOverrides ?? []) as DayOverride[]) {
        overrideInfoById.set(row.id, {
          date: row.date,
          stationId: row.station_id,
        });
      }

      const overrideTimeByStationDateAndShift = new Map<
        string,
        { start: string; end: string }
      >();

      for (const shift of overrideShifts) {
        const info = overrideInfoById.get(shift.override_id);
        if (!info) continue;

        const key = `${info.stationId}|${info.date}|${normalizeShiftName(
          shift.name
        )}`;

        overrideTimeByStationDateAndShift.set(key, {
          start: shift.start_time,
          end: shift.end_time,
        });
      }

      const enhancedAssignments: Assignment[] = (
        (assignments ?? []) as Assignment[]
      ).map((assignment) => {
        const key = `${assignment.station_id}|${
          assignment.date
        }|${normalizeShiftName(assignment.shift_name)}`;

        const overrideTime = overrideTimeByStationDateAndShift.get(key);

        if (!overrideTime) return assignment;

        return {
          ...assignment,
          override_start_time: overrideTime.start,
          override_end_time: overrideTime.end,
        };
      });

      const byEmployeeAndStation: Record<string, Record<string, Assignment[]>> =
        {};

      for (const assignment of enhancedAssignments) {
        if (!byEmployeeAndStation[assignment.employee_id]) {
          byEmployeeAndStation[assignment.employee_id] = {};
        }

        if (!byEmployeeAndStation[assignment.employee_id][assignment.station_id]) {
          byEmployeeAndStation[assignment.employee_id][assignment.station_id] =
            [];
        }

        byEmployeeAndStation[assignment.employee_id][assignment.station_id].push(
          assignment
        );
      }

      const result: Record<string, number> = {};

      for (const [employeeId, byStation] of Object.entries(
        byEmployeeAndStation
      )) {
        let total = 0;

        for (const [assignmentStationId, list] of Object.entries(byStation)) {
          total += calculateHoursForAssignments(assignmentStationId, list);
        }

        result[employeeId] = Number(total.toFixed(2));
      }

      const employeesByName = new Map<string, Employee>();

      for (const employee of visibleEmployees) {
        if (employee.name) {
          employeesByName.set(employee.name.trim().toLowerCase(), employee);
        }
      }

      for (const shift of overrideShifts) {
        if (!shift.employee) continue;

        const employee = employeesByName.get(
          shift.employee.trim().toLowerCase()
        );
        if (!employee) continue;

        const info = overrideInfoById.get(shift.override_id);
        if (!info) continue;

        const alreadyHasAssignment = enhancedAssignments.some(
          (assignment) =>
            assignment.employee_id === employee.id &&
            assignment.station_id === info.stationId &&
            assignment.date === info.date &&
            normalizeShiftName(assignment.shift_name) ===
              normalizeShiftName(shift.name)
        );

        if (alreadyHasAssignment) continue;

        const hours = duration(shift.start_time, shift.end_time);
        result[employee.id] = Number(
          ((result[employee.id] ?? 0) + hours).toFixed(2)
        );
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