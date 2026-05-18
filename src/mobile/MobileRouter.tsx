import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import MobileTodayView from "./MobileTodayView";
import MobileTodayViewAdmin from "./MobileTodayViewAdmin";
import MobileTodayViewEmployee from "./MobileTodayViewEmployee";

import MobileMonthView from "./MobileMonthView";
import MobileMonthViewAdmin from "./MobileMonthViewAdmin";
import MobileMonthViewEmployee from "./MobileMonthViewEmployee";

import MobileNavBar from "./MobileNavBar";

export default function MobileRouter({ role, stationName, employees }) {
  const isAdmin = role === "admin";
  const isPlanner = role === "planner";
  const isEmployee = role === "employee";

  return (
    <div className="mobile-root">

      {/* ⭐ Mobile Navigation unten */}
      <MobileNavBar role={role} />

      <Routes>

        {/* ⭐ Heute */}
        {isAdmin && (
          <Route
            path="today"
            element={
              <MobileTodayViewAdmin
                stationName={stationName}
                employees={employees}
              />
            }
          />
        )}

        {isPlanner && (
          <Route
            path="today"
            element={
              <MobileTodayView
                stationName={stationName}
                employees={employees}
              />
            }
          />
        )}

        {isEmployee && (
          <Route
            path="today"
            element={<MobileTodayViewEmployee />}
          />
        )}

        {/* ⭐ Monat */}
        {isAdmin && (
          <Route
            path="month"
            element={
              <MobileMonthViewAdmin
                stationName={stationName}
                employees={employees}
              />
            }
          />
        )}

        {isPlanner && (
          <Route
            path="month"
            element={
              <MobileMonthView
                stationName={stationName}
                employees={employees}
              />
            }
          />
        )}

        {isEmployee && (
          <Route
            path="month"
            element={<MobileMonthViewEmployee />}
          />
        )}

        {/* ⭐ Fallback → Heute */}
        <Route path="*" element={<Navigate to="today" replace />} />

      </Routes>
    </div>
  );
}
