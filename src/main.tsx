// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./AppRouter";
import { ThemeProvider } from "./theme/ThemeProvider";

import "./global.css";

// Supabase
import { supabase } from "./lib/supabaseClient";

declare global {
  interface Window {
    supabase: typeof supabase;
  }
}
window.supabase = supabase;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>
);
