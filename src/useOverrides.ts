import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { onAssignmentsChanged } from "./events";

export function useOverrides(stationId: string, year: number, month: number) {
  const [overrides, setOverrides] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!stationId) return;

    setLoading(true);

    const from = new Date(year, month, 1).toISOString().slice(0, 10);
    const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const { data: days } = await supabase
      .from("day_overrides")
      .select("*")
      .eq("station_id", stationId)
      .gte("date", from)
      .lte("date", to);

    if (!days || days.length === 0) {
      setOverrides({});
      setLoading(false);
      return;
    }

    const ids = days.map((d) => d.id);

    const { data: shifts } = await supabase
      .from("override_shifts")
      .select("*")
      .in("override_id", ids);

    const map: Record<string, any[]> = {};

    for (const d of days) {
      map[d.date] = [];
    }

    for (const s of shifts ?? []) {
      const day = days.find((d) => d.id === s.override_id);
      if (!day) continue;
      map[day.date].push(s);
    }

    setOverrides(map);
    setLoading(false);
  }, [stationId, year, month]);

  // Laden bei Monatswechsel
  useEffect(() => {
    load();
  }, [load]);

  // Neu laden, wenn Assignments geändert wurden
  useEffect(() => {
    const off = onAssignmentsChanged(() => load());
    return () => off();
  }, [load]);

  return { overrides, loading, reload: load };
}
