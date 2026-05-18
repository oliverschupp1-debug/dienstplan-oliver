import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useMonthlyHours(
  stationId: string | null,
  employeeId: string | null,
  year: number,
  month: number
) {
  const [hours, setHours] = useState(0);
  const [loading, setLoading] = useState(true);

  function getWeekdayIndex(date: Date, shiftName: string) {
    const lower = shiftName.toLowerCase();

    if (lower.startsWith("feiertag")) return 7;
    if (lower.startsWith("sonntag")) return 6;
    if (lower.startsWith("samstag")) return 5;

    // Normale Wochentage (Mo=0 … So=6)
    return (date.getDay() + 6) % 7;
  }

  function normalizeShiftName(name: string) {
    return name
      .replace(/^feiertag\s+/i, "")
      .replace(/^sonntag\s+/i, "")
      .replace(/^samstag\s+/i, "")
      .trim();
  }

  useEffect(() => {
    if (!stationId || !employeeId) {
      setHours(0);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      // 1) Assignments des Monats laden
      const { data: assignments, error: aErr } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", stationId)
        .eq("employee_id", employeeId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      if (aErr) {
        console.error("Fehler beim Laden der Assignments:", aErr);
        setHours(0);
        setLoading(false);
        return;
      }

      // 2) Shift-Modelle laden
      const { data: models } = await supabase
        .from("shift_models")
        .select("*")
        .eq("station_id", stationId);

      const modelMap = new Map<string, any>();
      for (const m of models ?? []) {
        const key = `${m.weekday}-${m.name}`.toLowerCase();
        modelMap.set(key, m);
      }

      let total = 0;

      // 3) Stunden berechnen
      for (const a of assignments ?? []) {
        const date = new Date(a.date);

        const weekdayIndex = getWeekdayIndex(date, a.shift_name);
        const normalizedName = normalizeShiftName(a.shift_name);

        const key = `${weekdayIndex}-${normalizedName}`.toLowerCase();
        const model = modelMap.get(key);

        if (!model) {
          console.warn("Kein shift_model gefunden für:", key);
          continue;
        }

        const startTime = a.override_start_time ?? model.start_time;
        const endTime = a.override_end_time ?? model.end_time;

        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);

        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        total += diff;
      }

      setHours(total);
      setLoading(false);
    }

    load();
  }, [stationId, employeeId, year, month]);

  return { hours, loading };
}
