// src/store/useAppStore.ts
import { create } from "zustand";

interface AppState {
  stationId: string | null;
  role: "admin" | "planner" | "employee" | null;
  employeeId: string | null;
  userName: string | null;

  year: number;
  month: number;

  setStationId: (id: string | null) => void;
  setRole: (role: "admin" | "planner" | "employee" | null) => void;
  setEmployeeId: (id: string | null) => void;
  setUserName: (name: string | null) => void;

  setYear: (y: number) => void;
  setMonth: (m: number) => void;

  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  stationId: null,
  role: null,
  employeeId: null,
  userName: null,

  year: new Date().getFullYear(),
  month: new Date().getMonth(),

  setStationId: (id) => set({ stationId: id }),
  setRole: (role) => set({ role }),
  setEmployeeId: (id) => set({ employeeId: id }),
  setUserName: (name) => set({ userName: name }),

  setYear: (y) => set({ year: y }),
  setMonth: (m) => set({ month: m }),

  reset: () =>
    set({
      stationId: null,
      role: null,
      employeeId: null,
      userName: null,
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
    }),
}));
