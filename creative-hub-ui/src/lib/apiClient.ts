// src/lib/apiClient.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

/**
 * Axios client configured for cookie-based authentication.
 * 
 * Authentication flow:
 * 1. POST /auth/login sets HttpOnly cookie (ch_access)
 * 2. Browser automatically sends cookie with every request (withCredentials: true)
 * 3. No need to store tokens in localStorage or set Authorization headers
 * 4. POST /auth/logout clears the cookie
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required: sends cookies with cross-origin requests
});

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, the token is invalid/expired
    if (error.response?.status === 401) {
      // Dispatch a custom event that AuthContext can listen to
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);
