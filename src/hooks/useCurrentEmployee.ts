import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCurrentEmployee() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setEmployee(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("Fehler beim Laden des Mitarbeiters:", error);
      }

      setEmployee(data);
      setLoading(false);
    }

    load();
  }, []);

  return { employee, loading };
}
