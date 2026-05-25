// src/useOverrides.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { onAssignmentsChanged } from "./events";

type OverrideDayRow = {
  id: number;
  date: string;
};

type OverrideShiftRow = {
  id: string;
  override_id: number;
  name: string;
  start_time: string;
  end_time: string;
  employee: string | null;
};

export type OverrideShift = {
  name: string;
  start: string;
  end: string;
  employee: string | null;
};

export function useOverrides(stationId: string) {
  const [overrides, setOverrides] = useState<Record<string, OverrideShift[]>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!stationId) {
      setOverrides({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: days, error: dayError } = await supabase
      .from("day_overrides")
      .select("id, date")
      .eq("station_id", stationId);

    if (dayError || !days || days.length === 0) {
      setOverrides({});
      setLoading(false);
      return;
    }

    const overrideDays = days as OverrideDayRow[];
    const ids = overrideDays.map((day) => day.id);

    const { data: shifts, error: shiftError } = await supabase
      .from("override_shifts")
      .select("id, override_id, name, start_time, end_time, employee")
      .in("override_id", ids);

    if (shiftError) {
      console.error("Fehler beim Laden der Override-Schichten:", shiftError);
      setOverrides({});
      setLoading(false);
      return;
    }

    const map: Record<string, OverrideShift[]> = {};

    for (const day of overrideDays) {
      map[day.date] = [];
    }

    for (const shift of (shifts ?? []) as OverrideShiftRow[]) {
      const day = overrideDays.find((entry) => entry.id === shift.override_id);
      if (!day) continue;

      map[day.date].push({
        name: shift.name,
        start: shift.start_time,
        end: shift.end_time,
        employee: shift.employee ?? null,
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
    if (!stationId) return;

    const iso = date.split("T")[0];

    if (shifts === null) {
      const { data: day } = await supabase
        .from("day_overrides")
        .select("id")
        .eq("station_id", stationId)
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
        .eq("station_id", stationId)
        .eq("date", iso);

      await load();
      return;
    }

    const { data: day, error: dayError } = await supabase
      .from("day_overrides")
      .upsert({ station_id: stationId, date: iso, note: "" })
      .select()
      .single();

    if (dayError || !day) {
      console.error("Override konnte nicht gespeichert werden:", dayError);
      return;
    }

    const overrideId = day.id as number;

    await supabase
      .from("override_shifts")
      .delete()
      .eq("override_id", overrideId);

    const rows =
      shifts.map((shift) => ({
        override_id: overrideId,
        name: shift.name,
        start_time: shift.start,
        end_time: shift.end,
        employee: shift.employee ?? null,
      })) ?? [];

    if (rows.length > 0) {
      await supabase.from("override_shifts").insert(rows);
    }

    await load();
  }

  return { overrides, loading, reload: load, saveOverride };
}