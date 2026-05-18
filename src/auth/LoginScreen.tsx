
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import "./LoginScreen.css";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || "Login fehlgeschlagen");
    }

    setLoading(false);
  }

  async function forceLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="login-root">
      <h2>Dienstplan Login</h2>

      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {errorMsg && <div className="login-error">{errorMsg}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Bitte warten…" : "Login"}
        </button>
      </form>

      <button className="login-reset" onClick={forceLogout}>
        Als anderer Benutzer anmelden
      </button>
    </div>
  );
}
