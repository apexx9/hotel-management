import { create } from "zustand";

export type ResetMode = "email" | "phone";

interface ResetState {
  mode: ResetMode;
  setMode: (mode: ResetMode) => void;
}

export const useResetMode = create<ResetState>((set) => ({
  mode: "email",

  setMode: (mode) => {
    set({ mode });
  },
}));
