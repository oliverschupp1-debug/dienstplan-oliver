import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useStations() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("stations")
        .select("id, name");

      if (error) {
        console.error("Fehler beim Laden der Stationen:", error);
        setStations([]);
      } else {
        setStations(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  return { stations, loading };
}
