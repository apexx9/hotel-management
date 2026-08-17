import { LoginSchema, RegisterSchema } from "../schema/auth.schema";
import authApi from "../actions/auth";
import useAuthStore from "../store/useAuthStore";

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
      }

      if (user) {
        useAuthStore.getState().setAuth(user, accessToken);
      }

      return data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || "Login failed";
      console.error(message);
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
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed";
      console.error(message);
      throw error;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
      useAuthStore.getState().clearAuth();
      localStorage.removeItem("token");
      // store token (basic approach) — you may switch to httpOnly cookies later
    } catch (error: any) {
      console.log(error.response.data.message);
    }
  }

  return {
    login,
    register,
    logout,
  };
};

export default AuthService;
