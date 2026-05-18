import React from "react";
import "./AppLayout.css";

export default function AppLayout({ sidebar, children }) {
  return (
    <div className="layout-root">
      <aside className="layout-sidebar">
        {sidebar}
      </aside>

      <main className="layout-main">
        <div className="layout-content">
          {children}
        </div>
      </main>
    </div>
  );
}
