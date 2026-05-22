// src/AppRouter.tsx
import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useAppStore } from "./store/useAppStore";
import AppShell from "./layout/AppShell";
import LoginScreen from "./auth/LoginScreen";
import { supabase } from "./lib/supabaseClient";

export default function AppRouter() {
  const { user } = useAuth(); // ✔ logout entfernt

  const setStationId = useAppStore((s) => s.setStationId);
  const setRole = useAppStore((s) => s.setRole);
  const setEmployeeId = useAppStore((s) => s.setEmployeeId);
  const setUserName = useAppStore((s) => s.setUserName);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Fehler beim Laden der Userdaten:", error);
        return;
      }

      setStationId(data.station_id);
      setRole(data.role);
      setEmployeeId(data.id);
      setUserName(data.name);
    }

    loadUserData();
  }, [user]);

  if (!user) return <LoginScreen />;

  return <AppShell />;
}
