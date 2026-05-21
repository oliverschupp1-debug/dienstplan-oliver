import { useTheme } from "./ThemeProvider";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <div className="theme-toggle-container">
      <button
        className={`theme-btn ${mode === "light" ? "active" : ""}`}
        onClick={() => setMode("light")}
      >
        ☀️
      </button>

      <button
        className={`theme-btn ${mode === "system" ? "active" : ""}`}
        onClick={() => setMode("system")}
      >
        🖥️
      </button>

      <button
        className={`theme-btn ${mode === "dark" ? "active" : ""}`}
        onClick={() => setMode("dark")}
      >
        🌙
      </button>
    </div>
  );
}
