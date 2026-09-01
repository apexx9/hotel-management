import { create } from "zustand";

interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User | null, accessToken: string | null) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (user: User | null, accessToken: string | null) =>
    set({
      user,
      accessToken,
      isAuthenticated: !!user,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    }),
}));

export default useAuthStore;
