// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAppStore } from "../store/useAppStore";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const resetStore = useAppStore((s) => s.reset);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  }

  async function logout() {
    await supabase.auth.signOut();
    resetStore();
    setUser(null);
  }

  return { user, login, logout };
}
