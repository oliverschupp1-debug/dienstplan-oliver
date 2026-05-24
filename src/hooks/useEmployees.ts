// src/hooks/useEmployees.ts
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Employee = {
  id: string;
  name: string | null;
  station_id: string | null;
  max_hours: number | null;
  remarks: string | null;
  auth_user_id: string | null;
  role: "admin" | "planner" | "employee" | null;
  vacation_days_total: number | null;
  vacation_note: string | null;
};

export function useEmployees(stationId: string | null) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    if (!stationId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, name, station_id, max_hours, remarks, auth_user_id, role, vacation_days_total, vacation_note"
      )
      .eq("station_id", stationId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der Mitarbeiter:", error);
      setEmployees([]);
    } else {
      setEmployees(data ?? []);
    }

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!stationId) {
        setEmployees([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("employees")
        .select(
          "id, name, station_id, max_hours, remarks, auth_user_id, role, vacation_days_total, vacation_note"
        )
        .eq("station_id", stationId)
        .order("name", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Fehler beim Laden der Mitarbeiter:", error);
        setEmployees([]);
      } else {
        setEmployees(data ?? []);
      }

      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { employees, loading, reload: loadEmployees };
}