// useOverrides.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { onAssignmentsChanged } from "./events";

type OverrideShiftRow = {
  id: string;
  override_id: string;
  name: string;
  start_time: string;
  end_time: string;
};

export type OverrideShift = {
  name: string;
  start: string;
  end: string;
};

export function useOverrides(stationId: string) {
  const [overrides, setOverrides] = useState<Record<string, OverrideShift[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const safeStation = stationId; // NICHT lowercased, NICHT verändert

    if (!safeStation) {
      setOverrides({});
      return;
    }

    setLoading(true);

    const { data: days, error: dayError } = await supabase
      .from("day_overrides")
      .select("*")
      .eq("station_id", safeStation);

    if (dayError || !days || days.length === 0) {
      setOverrides({});
      setLoading(false);
      return;
    }

    const ids = days.map((d) => d.id as string);

    const { data: shifts, error: shiftError } = await supabase
      .from("override_shifts")
      .select("*")
      .in("override_id", ids);

    if (shiftError) {
      setOverrides({});
      setLoading(false);
      return;
    }

    const map: Record<string, OverrideShift[]> = {};

    for (const d of days) {
      map[d.date] = [];
    }

    for (const s of (shifts ?? []) as OverrideShiftRow[]) {
      const day = days.find((d) => d.id === s.override_id);
      if (!day) continue;

      map[day.date].push({
        name: s.name,
        start: s.start_time,
        end: s.end_time,
      });
    }

    setOverrides(map);
    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const off = onAssignmentsChanged(() => load());
    return () => {
      off();
    };
  }, [load]);

  async function saveOverride(date: string, shifts: OverrideShift[] | null) {
    const safeStation = stationId; // NICHT lowercased, NICHT verändert
    if (!safeStation) return;

    const iso = date.split("T")[0];

    if (shifts === null) {
      const { data: day } = await supabase
        .from("day_overrides")
        .select("id")
        .eq("station_id", safeStation)
        .eq("date", iso)
        .maybeSingle();

      if (day?.id) {
        await supabase
          .from("override_shifts")
          .delete()
          .eq("override_id", day.id);
      }

      await supabase
        .from("day_overrides")
        .delete()
        .eq("station_id", safeStation)
        .eq("date", iso);

      load();
      return;
    }

    const { data: day } = await supabase
      .from("day_overrides")
      .upsert({ station_id: safeStation, date: iso, note: "" })
      .select()
      .single();

    const overrideId = day.id as string;

    await supabase
      .from("override_shifts")
      .delete()
      .eq("override_id", overrideId);

    const rows =
      shifts?.map((s) => ({
        override_id: overrideId,
        name: s.name,
        start_time: s.start,
        end_time: s.end,
      })) ?? [];

    if (rows.length > 0) {
      await supabase.from("override_shifts").insert(rows);
    }

    load();
  }

  return { overrides, loading, reload: load, saveOverride };
}
