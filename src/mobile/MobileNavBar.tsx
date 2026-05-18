import React from "react";
import { NavLink } from "react-router-dom";
import "./MobileNavBar.css";

export default function MobileNavBar({ role }) {
  const isAdmin = role === "admin";
  const isPlanner = role === "planner";
  const isEmployee = role === "employee";

  return (
    <nav className="mobile-nav">
      <NavLink
        to="/m/today"
        className={({ isActive }) =>
          "mobile-nav-item" + (isActive ? " active" : "")
        }
      >
        Heute
      </NavLink>

      <NavLink
        to="/m/month"
        className={({ isActive }) =>
          "mobile-nav-item" + (isActive ? " active" : "")
        }
      >
        Monat
      </NavLink>

      {(isAdmin || isPlanner) && (
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
