import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ Session laden
  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();

      // Wenn Session existiert → übernehmen
      if (data?.session?.user) {
        setUser(data.session.user);
      } else {
        // ⭐ Wenn Session ungültig → ausloggen
        await supabase.auth.signOut();
        setUser(null);
      }

      setLoading(false);
    }

    loadSession();

    // ⭐ Listener für Login/Logout
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) setUser(session.user);
        else setUser(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return { user, loading, login, logout };
}
