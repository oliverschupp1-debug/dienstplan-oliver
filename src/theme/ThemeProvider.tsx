import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("theme-mode") as ThemeMode) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // System theme listener
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => {
      const systemTheme = media.matches ? "dark" : "light";

      if (mode === "system") {
        setResolvedTheme(systemTheme);
        document.documentElement.setAttribute("data-theme", systemTheme);
      }
    };

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, [mode]);

  // Apply theme when mode changes
  useEffect(() => {
    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      setResolvedTheme(systemTheme);
      document.documentElement.setAttribute("data-theme", systemTheme);
    } else {
      setResolvedTheme(mode);
      document.documentElement.setAttribute("data-theme", mode);
    }

    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
