import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* Wichtig: Apple‑Style UI laden */
import "./global.css";

/* Deine bestehenden Styles */
import "./index.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
