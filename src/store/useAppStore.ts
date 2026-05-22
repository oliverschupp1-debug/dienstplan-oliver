import { create } from "zustand";

export type AppState = {
  stationId: string | null;
  role: "admin" | "planner" | "employee" | null;

  setStation: (stationId: string | null) => void;
  setRole: (role: "admin" | "planner" | "employee" | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  stationId: null,
  role: null,

  setStation: (stationId) => set({ stationId }),
  setRole: (role) => set({ role }),
}));
