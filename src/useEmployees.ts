import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type Employee = {
  id: string;
  name: string;
  max_hours: number | null;
  station_id: string;
};

export function useEmployees(stationId: string) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("station_id", stationId)
      .order("name", { ascending: true });

    if (!error && data) {
      setEmployees(data);
    }

    setLoading(false);
  }

  async function addEmployee(name: string, maxHours: number | null) {
    const { data, error } = await supabase
      .from("employees")
      .insert([{ name, max_hours: maxHours, station_id: stationId }])
      .select()
      .single();

    if (!error && data) {
      setEmployees((prev) => [...prev, data]);
    }
  }

  async function updateEmployee(id: string, name: string, maxHours: number | null) {
    const { data, error } = await supabase
      .from("employees")
      .update({ name, max_hours: maxHours })
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? data : e))
      );
    }
  }

  async function deleteEmployee(id: string) {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (!error) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [stationId]);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    reload: loadEmployees
  };
}
