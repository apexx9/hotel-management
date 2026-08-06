import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  toggleOpen: () => void;
}

interface ResetModeState {
  mode: string | "email" | "phone";
  setMode: (mode: string) => void;
}

const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));

const useResetMode = create<ResetModeState>((set) => ({
  mode: "email",
  setMode: (mode) => set({ mode: mode }),
}));

export { useModalStore, useResetMode };
