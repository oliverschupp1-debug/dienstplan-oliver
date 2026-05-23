import "./AppLayout.css";
import type { ReactNode } from "react";

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AppLayout({ sidebar, children }: Props) {
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
