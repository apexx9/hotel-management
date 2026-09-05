import { instance } from "./api";
import { LoginSchema, RegisterSchema } from "../schema/auth.schema";

export const authApi = {
  register: (payload: RegisterSchema) =>
    instance.post("/auth/register", payload),
  login: (payload: LoginSchema) => instance.post("/auth/login", payload),
  logout: () => instance.post("/auth/logout"),
  requestVerify: (email: string) =>
    instance.post("/auth/request-verify", { email }),
  verify: (token: string) => instance.post("/auth/verify", { token }),
  requestReset: (identifier: string) =>
    instance.post("/auth/request-reset", { identifier }),
  reset: (token: string, password: string) =>
    instance.post("/auth/reset", { token, password }),
  validateToken: (token: string) =>
    instance.post("/auth/validate-token", { token }),
  getInvitation: (token: string) => instance.get(`/invitations/${token}`),
  acceptInvitation: (token: string, payload: Record<string, unknown>) =>
    instance.post(`/invitations/${token}/accept`, payload),
  getCurrentUser: () => instance.get("/auth/me"),
};

export default authApi;
