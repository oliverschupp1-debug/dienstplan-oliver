// src/hooks/useAllMonthlyHours.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { calculateHoursForAssignments } from "../utils/hoursUtils";

export function useAllMonthlyHours(
  stationId: string | null,
  year: number,
  month: number,
  reloadFlag: number
) {
  const [hoursMap, setHoursMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  function toLocalIso(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  useEffect(() => {
    if (!stationId) {
      setHoursMap({});
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      const firstDay = toLocalIso(new Date(year, month, 1));
      const lastDay = toLocalIso(new Date(year, month + 1, 0));

      const { data: assignments, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (error) {
        console.error("Fehler beim Laden der Assignments:", error);
        setHoursMap({});
        setLoading(false);
        return;
      }

      const byEmployee: Record<string, any[]> = {};
      for (const a of assignments ?? []) {
        if (!byEmployee[a.employee_id]) byEmployee[a.employee_id] = [];
        byEmployee[a.employee_id].push(a);
      }

      const result: Record<string, number> = {};
      for (const [employeeId, list] of Object.entries(byEmployee)) {
        result[employeeId] = calculateHoursForAssignments(
          stationId,
          list as any[]
        );
      }

      setHoursMap(result);
      setLoading(false);
    }

    load();
  }, [stationId, year, month, reloadFlag]);

  return { hoursMap, loading };
}
