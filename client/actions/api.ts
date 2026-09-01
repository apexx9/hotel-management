import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const rawBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const baseURL = rawBase.replace(/\/$/, "") + "/api";

export const instance = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshing: Promise<string | null> | null = null;

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original || error.response?.status !== 401 || original._retry || original.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshing ??= instance.post<{ ok: boolean; token?: string }>("/auth/refresh")
        .then(({ data }) => {
          if (!data.ok || !data.token) return null;
          localStorage.setItem("token", data.token);
          document.cookie = `access_token=${encodeURIComponent(data.token)}; path=/; max-age=604800; SameSite=Lax`;
          return data.token;
        })
        .finally(() => { refreshing = null; });

      const token = await refreshing;
      if (!token) return Promise.reject(error);
      original.headers.Authorization = `Bearer ${token}`;
      return instance(original);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      return Promise.reject(error);
    }
  },
);
