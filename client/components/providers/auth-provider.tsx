"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";
import AuthService from "@/services/auth.service";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    // Only fetch if no user is present, but we might still be authenticated via refresh token
    if (!user) {
      AuthService()
        .getCurrentUser()
        .then((currentUser) => {
          // Preserve existing access token (if any) and set user
          setAuth(currentUser, accessToken);
        })
        .catch(() => {
          // Optional: if fetching user fails (e.g., invalid refresh token), clear auth state
          // useAuthStore.getState().clearAuth();
          // You might also redirect to login here if needed
        });
    }
  }, [user, setAuth, accessToken]);

  return <>{children}</>;
}
