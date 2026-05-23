// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

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
    <App />
  </React.StrictMode>
);
