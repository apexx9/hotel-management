import { LoginSchema, RegisterSchema } from "../schema/auth.schema";
import authApi from "../actions/auth";
import useAuthStore from "../store/useAuthStore";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };

    return response.response?.data?.message || response.message || fallback;
  }

  return fallback;
};

const AuthService = () => {
  async function login(payload: LoginSchema) {
    try {
      const response = await authApi.login(payload);
      const data = response.data;

      if (!data?.ok) {
        throw new Error(data?.message || "Invalid credentials");
      }

      const accessToken = data.token;
      const user = data.user;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        // Set cookie for proxy
        document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax`;
        console.log("Cookie set:", document.cookie);
      }

      if (user) {
        useAuthStore.getState().setAuth(user, accessToken);
      }

      return data;
    } catch (error: unknown) {
      console.error(getErrorMessage(error, "Login failed"));
      throw error;
    }
  }

  async function logout() {
    try {
      // Call backend to revoke refresh token
      await authApi.logout();

      // Clear client-side state
      useAuthStore.getState().clearAuth();
      localStorage.removeItem("token");

      // Clear the access_token cookie
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      console.log("Cookie cleared:", document.cookie);

      return { ok: true };
    } catch (error: unknown) {
      console.error("Logout error:", getErrorMessage(error, "Logout failed"));

      // Even if backend logout fails, clear local session
      useAuthStore.getState().clearAuth();
      localStorage.removeItem("token");
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      throw error;
    }
  }

  async function register(payload: RegisterSchema) {
    try {
      const response = await authApi.register(payload);
      const data = response.data;

      if (data?.ok === false) {
        throw new Error(data?.message || "Registration failed");
      }

      return data;
    } catch (error: unknown) {
      console.error(getErrorMessage(error, "Registration failed"));
      throw error;
    }
  }

  return {
    login,
    register,
    logout,
  };
};

export default AuthService;
