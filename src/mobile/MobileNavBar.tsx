import { supabase } from "../lib/supabaseClient";
import { useTheme } from "../theme/ThemeProvider";
import "./MobileNavBar.css";

type Props = {
  role: "admin" | "planner" | "employee";
  activeView: "today" | "month";
  onViewChange: (view: "today" | "month") => void;
  onToggleEmployees?: () => void;
};

export default function MobileNavBar({
  role,
  activeView,
  onViewChange,
  onToggleEmployees,
}: Props) {
  const { mode, setMode } = useTheme();

  const isStaff = role === "admin" || role === "planner";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <nav className="mobile-nav">
      <button
        type="button"
        className={
          "mobile-nav-item" + (activeView === "today" ? " active" : "")
        }
        onClick={() => onViewChange("today")}
      >
        Heute
      </button>

      <button
        type="button"
        className={
          "mobile-nav-item" + (activeView === "month" ? " active" : "")
        }
        onClick={() => onViewChange("month")}
      >
        Monat
      </button>

      {isStaff && (
        <button
          type="button"
          className="mobile-nav-item mobile-nav-button"
          onClick={onToggleEmployees}
        >
          Mitarbeiter
        </button>
      )}

      <select
        className="mobile-nav-select"
        value={mode}
        onChange={(event) =>
          setMode(event.target.value as "light" | "dark" | "system")
        }
        aria-label="Theme wählen"
      >
        <option value="light">Hell</option>
        <option value="dark">Dunkel</option>
        <option value="system">System</option>
      </select>

      <button
        type="button"
        className="mobile-nav-item mobile-logout-btn"
        onClick={handleLogout}
      >
        Logout
      </button>
    </nav>
  );
}