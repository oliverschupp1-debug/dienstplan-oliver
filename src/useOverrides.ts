import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { onAssignmentsChanged } from "./events";

export function useOverrides(stationId: string) {
  const [overrides, setOverrides] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!stationId) return;

    setLoading(true);

    const { data: days } = await supabase
      .from("day_overrides")
      .select("*")
      .eq("station_id", stationId);

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
  }, [stationId]);

  // Laden beim Start
  useEffect(() => {
    load();
  }, [load]);

  // Neu laden, wenn Assignments geändert wurden
  useEffect(() => {
    onAssignmentsChanged(() => load());
  }, [load]);

  // -------------------------------------------------------------
  // Override speichern
  // -------------------------------------------------------------
  async function saveOverride(date: string, shifts: any[] | null) {
    if (!stationId) return;

    const iso = date.split("T")[0];

    if (shifts === null) {
      // Override löschen
      await supabase.from("day_overrides").delete().eq("station_id", stationId).eq("date", iso);
      await supabase.from("override_shifts").delete().eq("date", iso);
      load();
      return;
    }

    // Day override anlegen oder holen
    const { data: day } = await supabase
      .from("day_overrides")
      .upsert({ station_id: stationId, date: iso, note: "" })
      .select()
      .single();

    const overrideId = day.id;

    // Alte Shifts löschen
    await supabase.from("override_shifts").delete().eq("override_id", overrideId);

    // Neue Shifts einfügen
    const rows = shifts.map((s) => ({
      override_id: overrideId,
      name: s.name,
      start_time: s.start,
      end_time: s.end
    }));

    if (rows.length > 0) {
      await supabase.from("override_shifts").insert(rows);
    }

    load();
  }

  return { overrides, loading, reload: load, saveOverride };
}
