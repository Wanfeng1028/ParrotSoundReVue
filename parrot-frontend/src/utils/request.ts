import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { ElMessage } from "element-plus";
import { canHandleDemoRequest, handleDemoRequest } from "../mocks/demo-api";

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
      ElMessage.error({
        message: payload.msg || "请求失败",
        grouping: true,
      });
      return Promise.reject(new Error(payload.msg || "请求失败"));
    }
    return response;
  },
  (error: AxiosError<{ msg?: string }>) => {
    const message = error.response?.data?.msg || error.message || "请求失败";
    ElMessage.error({
      message,
      grouping: true,
    });
    return Promise.reject(error);
  },
);

export const apiRequest = <T>(config: AxiosRequestConfig) =>
  canHandleDemoRequest()
    ? handleDemoRequest<T>(config)
    : request(config).then((response) => response.data as ApiResponse<T>);
