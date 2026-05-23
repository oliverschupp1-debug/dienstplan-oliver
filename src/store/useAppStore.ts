// src/store/useAppStore.ts
import { create } from "zustand";

export type AppRole = "admin" | "planner" | "employee";

interface UserProfileState {
  stationId: string | null;
  role: AppRole | null;
  employeeId: string | null;
  userName: string | null;
}

interface AppState extends UserProfileState {
  year: number;
  month: number;

  setStationId: (id: string | null) => void;
  setRole: (role: AppRole | null) => void;
  setEmployeeId: (id: string | null) => void;
  setUserName: (name: string | null) => void;

  setUserProfile: (profile: UserProfileState) => void;

  setYear: (y: number) => void;
  setMonth: (m: number) => void;

  reset: () => void;
}

const now = () => ({
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
});

export const useAppStore = create<AppState>((set) => ({
  stationId: null,
  role: null,
  employeeId: null,
  userName: null,

  ...now(),

  setStationId: (id) => set({ stationId: id }),
  setRole: (role) => set({ role }),
  setEmployeeId: (id) => set({ employeeId: id }),
  setUserName: (name) => set({ userName: name }),

  setUserProfile: (profile) =>
    set({
      stationId: profile.stationId,
      role: profile.role,
      employeeId: profile.employeeId,
      userName: profile.userName,
    }),

  setYear: (y) => set({ year: y }),
  setMonth: (m) => set({ month: m }),

  reset: () =>
    set({
      stationId: null,
      role: null,
      employeeId: null,
      userName: null,
      ...now(),
    }),
}));