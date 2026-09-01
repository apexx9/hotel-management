// store/ui-store.ts
import { create } from 'zustand';

interface UIState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  toggleCollapsed: () =>
    set((state) => ({ isCollapsed: !state.isCollapsed })),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
}));
