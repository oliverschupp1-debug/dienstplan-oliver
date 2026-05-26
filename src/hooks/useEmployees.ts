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

const EMPLOYEE_SELECT =
  "id, name, station_id, max_hours, remarks, auth_user_id, role, vacation_days_total, vacation_note";

function sortEmployeesByName(employees: Employee[]) {
  return employees.slice().sort((a, b) => {
    return (a.name ?? "").localeCompare(b.name ?? "", "de");
  });
}

function uniqueEmployees(employees: Employee[]) {
  const map = new Map<string, Employee>();

  for (const employee of employees) {
    map.set(employee.id, employee);
  }

  return Array.from(map.values());
}

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

    const { data: stationEmployees, error: stationError } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .eq("station_id", stationId);

    if (stationError) {
      console.error("Fehler beim Laden der Mitarbeiter:", stationError);
      setEmployees([]);
      setLoading(false);
      return;
    }

    const { data: accessRows, error: accessError } = await supabase
      .from("employee_station_access")
      .select("employee_id")
      .eq("station_id", stationId);

    if (accessError) {
      console.error("Fehler beim Laden der Zusatzstationen:", accessError);
      setEmployees(sortEmployeesByName((stationEmployees ?? []) as Employee[]));
      setLoading(false);
      return;
    }

    const extraIds = (accessRows ?? [])
      .map((row) => row.employee_id as string)
      .filter(Boolean);

    if (extraIds.length === 0) {
      setEmployees(sortEmployeesByName((stationEmployees ?? []) as Employee[]));
      setLoading(false);
      return;
    }

    const { data: extraEmployees, error: extraError } = await supabase
      .from("employees")
      .select(EMPLOYEE_SELECT)
      .in("id", extraIds);

    if (extraError) {
      console.error(
        "Fehler beim Laden der freigegebenen Mitarbeiter:",
        extraError
      );

      setEmployees(sortEmployeesByName((stationEmployees ?? []) as Employee[]));
      setLoading(false);
      return;
    }

    const merged = uniqueEmployees([
      ...((stationEmployees ?? []) as Employee[]),
      ...((extraEmployees ?? []) as Employee[]),
    ]);

    setEmployees(sortEmployeesByName(merged));
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

      const { data: stationEmployees, error: stationError } = await supabase
        .from("employees")
        .select(EMPLOYEE_SELECT)
        .eq("station_id", stationId);

      if (cancelled) return;

      if (stationError) {
        console.error("Fehler beim Laden der Mitarbeiter:", stationError);
        setEmployees([]);
        setLoading(false);
        return;
      }

      const { data: accessRows, error: accessError } = await supabase
        .from("employee_station_access")
        .select("employee_id")
        .eq("station_id", stationId);

      if (cancelled) return;

      if (accessError) {
        console.error("Fehler beim Laden der Zusatzstationen:", accessError);
        setEmployees(
          sortEmployeesByName((stationEmployees ?? []) as Employee[])
        );
        setLoading(false);
        return;
      }

      const extraIds = (accessRows ?? [])
        .map((row) => row.employee_id as string)
        .filter(Boolean);

      if (extraIds.length === 0) {
        setEmployees(
          sortEmployeesByName((stationEmployees ?? []) as Employee[])
        );
        setLoading(false);
        return;
      }

      const { data: extraEmployees, error: extraError } = await supabase
        .from("employees")
        .select(EMPLOYEE_SELECT)
        .in("id", extraIds);

      if (cancelled) return;

      if (extraError) {
        console.error(
          "Fehler beim Laden der freigegebenen Mitarbeiter:",
          extraError
        );

        setEmployees(
          sortEmployeesByName((stationEmployees ?? []) as Employee[])
        );
        setLoading(false);
        return;
      }

      const merged = uniqueEmployees([
        ...((stationEmployees ?? []) as Employee[]),
        ...((extraEmployees ?? []) as Employee[]),
      ]);

      setEmployees(sortEmployeesByName(merged));
      setLoading(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { employees, loading, reload: loadEmployees };
}