// src/hooks/useStations.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type Station = {
  id: string;
  name: string;
};

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("stations")
        .select("id, name")
        .order("name", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Fehler beim Laden der Stationen:", error);
        setStations([]);
      } else {
        setStations(data ?? []);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, loading };
}