import axios, { AxiosResponse } from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

//Get
const get = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await instance.get<T>(url);
  return response.data;
};

export { instance, get };
