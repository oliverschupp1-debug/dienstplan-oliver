// src/hooks/useEmployees.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useEmployees(stationId: string | null) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadEmployees = useCallback(async () => {
    // Wenn keine Station gewählt ist → leere Liste, kein Loading
    if (!stationId) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("station_id", stationId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der Mitarbeiter:", error);
      setEmployees([]);
    } else {
      setEmployees(data || []);
    }

    setLoading(false);
  }, [stationId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return { employees, loading, reload: loadEmployees };
}
