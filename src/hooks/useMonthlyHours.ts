// src/hooks/useMonthlyHours.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { calculateHoursForAssignments } from "../utils/hoursUtils";

export function useMonthlyHours(
  stationId: string | null,
  employeeId: string | null,
  year: number,
  month: number
) {
  const [hours, setHours] = useState(0);
  const [loading, setLoading] = useState(true);

  function toLocalIso(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  useEffect(() => {
    if (!stationId || !employeeId) {
      setHours(0);
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
        .eq("employee_id", employeeId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (error) {
        console.error("Fehler beim Laden der Assignments:", error);
        setHours(0);
        setLoading(false);
        return;
      }

      const total = calculateHoursForAssignments(stationId, assignments ?? []);
      setHours(total);
      setLoading(false);
    }

    load();
  }, [stationId, employeeId, year, month]);

  return { hours, loading };
}
