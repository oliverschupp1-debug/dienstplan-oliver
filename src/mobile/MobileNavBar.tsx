import { NavLink } from "react-router-dom";
import "./MobileNavBar.css";

type Props = {
  role: "admin" | "planner" | "employee";
  onToggleEmployees?: () => void; // nur Admin/Planner
};

export default function MobileNavBar({ role, onToggleEmployees }: Props) {
  const isAdmin = role === "admin";
  const isPlanner = role === "planner";
  const isStaff = isAdmin || isPlanner;

  return (
    <nav className="mobile-nav">

      {/* Heute */}
      <NavLink
        to="/m/today"
        className={({ isActive }) =>
          "mobile-nav-item" + (isActive ? " active" : "")
        }
      >
        Heute
      </NavLink>

      {/* Monat */}
      <NavLink
        to="/m/month"
        className={({ isActive }) =>
          "mobile-nav-item" + (isActive ? " active" : "")
        }
      >
        Monat
      </NavLink>

      {/* Mitarbeiter-Panel nur für Admin/Planner */}
      {isStaff && (
        <button
          className="mobile-nav-item mobile-nav-button"
          onClick={onToggleEmployees}
        >
          Mitarbeiter
        </button>
      )}

      {/* Desktop-Link nur für Admin/Planner */}
      {isStaff && (
        <NavLink
          to="/"
          className="mobile-nav-item admin-link"
        >
          Desktop
        </NavLink>
      )}
    </nav>
  );
}
