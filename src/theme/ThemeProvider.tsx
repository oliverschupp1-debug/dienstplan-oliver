import React, { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext({
  theme: "system",
  setTheme: (t: string) => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("system");

  // gespeichertes Theme laden
  useEffect(() => {
    const saved = localStorage.getItem("theme-mode");
    if (saved) setThemeState(saved);
  }, []);

  // Theme anwenden
  useEffect(() => {
    localStorage.setItem("theme-mode", theme);

    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}
