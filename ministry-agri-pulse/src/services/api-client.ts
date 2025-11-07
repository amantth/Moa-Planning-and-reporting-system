import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const AUTH_TOKEN_KEY = "agri_app_auth_token";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export const storeAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};
