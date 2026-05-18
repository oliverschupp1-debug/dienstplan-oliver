import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src"
    }
  },

  // ⭐ WICHTIG: Fester Port, damit Supabase Sessions speichert
  server: {
    port: 5173,
    strictPort: true
  }
});
