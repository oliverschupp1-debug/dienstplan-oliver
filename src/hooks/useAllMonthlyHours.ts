import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

  // ⭐ NEU: Feiertage korrekt erkennen
  function getWeekdayIndex(date: Date, isHoliday: boolean) {
    if (isHoliday) return 7; // Feiertag
    return (date.getDay() + 6) % 7; // Mo=0 … So=6
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

      // ⭐ assignments jetzt MIT override-Zeiten
      const { data: assignments } = await supabase
        .from("assignments")
        .select("*")
        .eq("station_id", stationId)
        .gte("date", firstDay)
        .lte("date", lastDay);

      const { data: models } = await supabase
        .from("shift_models")
        .select("*")
        .eq("station_id", stationId);

      // ⭐ Modell-Map: weekday + shift_name
      const modelMap = new Map<string, any>();
      for (const m of models ?? []) {
        const key = `${m.weekday}-${m.name}`.toLowerCase();
        modelMap.set(key, m);
      }

      const result: Record<string, number> = {};

      for (const a of assignments ?? []) {
        const date = new Date(a.date);

        // ⭐ Feiertag erkennen (shift_name beginnt mit "Feiertag ")
        const isHoliday = a.shift_name.toLowerCase().startsWith("feiertag");

        const weekdayIndex = getWeekdayIndex(date, isHoliday);

        const key = `${weekdayIndex}-${a.shift_name}`.toLowerCase();
        const model = modelMap.get(key);

        if (!model) continue;

        // ⭐ Override-Zeiten verwenden, wenn vorhanden
        const startTime = a.override_start_time ?? model.start_time;
        const endTime = a.override_end_time ?? model.end_time;

        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        if (!result[a.employee_id]) result[a.employee_id] = 0;
        result[a.employee_id] += diff;
      }

      setHoursMap(result);
      setLoading(false);
    }

    load();
  }, [stationId, year, month, reloadFlag]);

  return { hoursMap, loading };
}
