"use client";

import { useEffect } from "react";
import useAuthStore from "@/store/useAuthStore";
import AuthService from "@/services/auth.service";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    let isActive = true;

    // A user already in the store (e.g. set during login) is authoritative;
    // only restore the session when we have a token but no user yet (hard refresh).
    if (user) return;

    const syncAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isActive) setAuth(null, null);
        return;
      }

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const currentUser = await AuthService().getCurrentUser();
          if (!isActive) return;
          setAuth(currentUser, token);
          return;
        } catch {
          // attempt again; transient network/refresh failures are retried below
        }
      }

      // All attempts failed: only clear the session if we truly have no user,
      // so a just-restored session is never blanked by a transient failure.
      if (!isActive) return;
      if (!useAuthStore.getState().user) setAuth(null, null);
    };

    syncAuth();

    return () => {
      isActive = false;
    };
  }, [user, setAuth]);

  return <>{children}</>;
}