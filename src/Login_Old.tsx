import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); // verhindert Chrome-Autofill-Blocker

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Login fehlgeschlagen: " + error.message);
    } else {
      alert("Login erfolgreich!");
    }
  }

  async function handleRegister() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert("Registrierung fehlgeschlagen: " + error.message);
    } else {
      alert("Registrierung erfolgreich! Bitte erneut einloggen.");
    }
  }

  return (
    <form onSubmit={handleLogin} style={{ padding: 20 }}>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="E-Mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <br />

      <input
        type="password"
        placeholder="Passwort"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <br /><br />

      <button type="submit">Login</button>

      <button
        type="button"
        onClick={handleRegister}
        style={{ marginLeft: 10 }}
      >
        Registrieren
      </button>
    </form>
  );
}
