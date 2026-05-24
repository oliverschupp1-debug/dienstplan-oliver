import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type AbsenceType =
  | "vacation"
  | "sick"
  | "unavailable";

export type EmployeeAbsence = {
  id: string;

  employee_id: string;
  station_id: string;

  start_date: string;
  end_date: string;

  type: AbsenceType;

  note: string | null;
};

export function useAbsences(stationId: string | null) {
  const [absences, setAbsences] = useState<EmployeeAbsence[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!stationId) {
      setAbsences([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("employee_absences")
      .select("*")
      .eq("station_id", stationId)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der Abwesenheiten:", error);
      setAbsences([]);
    } else {
      setAbsences(data ?? []);
    }

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAbsence(input: {
    employee_id: string;
    station_id: string;
    start_date: string;
    end_date: string;
    type: AbsenceType;
    note?: string;
  }) {
    const { error } = await supabase
      .from("employee_absences")
      .insert({
        employee_id: input.employee_id,
        station_id: input.station_id,
        start_date: input.start_date,
        end_date: input.end_date,
        type: input.type,
        note: input.note ?? null,
      });

    if (error) {
      console.error("Fehler beim Speichern der Abwesenheit:", error);
      throw error;
    }

    await load();
  }

  async function deleteAbsence(id: string) {
    const { error } = await supabase
      .from("employee_absences")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error);
      throw error;
    }

    await load();
  }

  return {
    absences,
    loading,
    reload: load,
    createAbsence,
    deleteAbsence,
  };
}