import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

export type Assignment = {
  id: string;
  station_id: string;
  date: string;
  shift_name: string;
  employee_id: string;
};

export function useAssignments(stationId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAssignments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("station_id", stationId.toLowerCase())
      .order("date", { ascending: true });

    if (!error && data) {
      setAssignments(data);
    }

    setLoading(false);
  }

  // ⭐ NEUE SIGNATUR — akzeptiert ein Objekt
  async function addAssignment(a: {
    date: string;
    shift_name: string;
    employee_id: string;
    station_id: string;
  }) {
    const { data, error } = await supabase
      .from("assignments")
      .insert([
        {
          station_id: a.station_id.toLowerCase(),
          date: a.date,
          shift_name: a.shift_name,
          employee_id: a.employee_id
        }
      ])
      .select()
      .single();

    if (!error && data) {
      setAssignments((prev) => [...prev, data]);
    }
  }

  async function removeAssignment(id: string) {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id);

    if (!error) {
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  }

  useEffect(() => {
    loadAssignments();
  }, [stationId]);

  return {
    assignments,
    loading,
    addAssignment,
    removeAssignment,
    reload: loadAssignments
  };
}
