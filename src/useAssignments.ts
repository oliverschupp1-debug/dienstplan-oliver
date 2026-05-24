// src/useAssignments.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabaseClient";
import { assignmentsChanged, onAssignmentsChanged } from "./events";

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

  const loadAssignments = useCallback(async () => {
    if (!stationId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("station_id", stationId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden der Assignments:", error);
      setAssignments([]);
    } else {
      setAssignments(data ?? []);
    }

    setLoading(false);
  }, [stationId]);

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
          station_id: a.station_id,
          date: a.date,
          shift_name: a.shift_name,
          employee_id: a.employee_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Fehler beim Speichern des Assignments:", error);
      return;
    }

    if (data) {
      setAssignments((prev) => [...prev, data]);
      assignmentsChanged();
    }
  }

  async function removeAssignment(id: string) {
    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen des Assignments:", error);
      return;
    }

    setAssignments((prev) => prev.filter((a) => a.id !== id));
    assignmentsChanged();
  }

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    const off = onAssignmentsChanged(() => {
      loadAssignments();
    });

    return () => {
      off();
    };
  }, [loadAssignments]);

  return {
    assignments,
    loading,
    addAssignment,
    removeAssignment,
    reload: loadAssignments,
  };
}