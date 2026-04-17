import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload.code !== 200) {
      ElMessage.error(payload.msg || "请求失败");
      return Promise.reject(new Error(payload.msg || "请求失败"));
    }
    return response;
  },
  (error: AxiosError<{ msg?: string }>) => {
    const message = error.response?.data?.msg || error.message || "网络请求失败";
    ElMessage.error(message);
    return Promise.reject(error);
  },
);

export const apiRequest = <T>(config: AxiosRequestConfig) =>
  request(config).then((response) => response.data as ApiResponse<T>);
