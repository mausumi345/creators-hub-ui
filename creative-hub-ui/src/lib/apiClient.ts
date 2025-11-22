// src/lib/apiClient.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // if you ever use cookies with Keycloak / sessions
});

// Optional: attach auth header if token is stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ch_access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
