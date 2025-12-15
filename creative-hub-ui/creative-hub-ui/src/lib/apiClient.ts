// src/lib/apiClient.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

/**
 * Axios client configured for cookie-based authentication with automatic token refresh.
 * 
 * Authentication flow:
 * 1. POST /auth/login sets two HttpOnly cookies:
 *    - ch_access: Short-lived JWT (15 min)
 *    - ch_refresh: Long-lived refresh token (14 days)
 * 2. Browser automatically sends cookies with every request (withCredentials: true)
 * 3. When ch_access expires, interceptor calls /auth/refresh to get new tokens
 * 4. POST /auth/logout clears both cookies
 * 
 * Token Refresh:
 * - On 401 response, automatically attempts token refresh
 * - If refresh succeeds, retries the original request
 * - If refresh fails, dispatches auth:unauthorized event
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required: sends cookies with cross-origin requests
});

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Queue of requests waiting for token refresh
interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
}
const requestQueue: QueuedRequest[] = [];

/**
 * Attempt to refresh the access token.
 * Returns true if successful, false otherwise.
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return response.data?.success === true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

/**
 * Process queued requests after token refresh.
 */
function processQueue(success: boolean): void {
  requestQueue.forEach(({ resolve, reject, config }) => {
    if (success) {
      // Retry the request
      resolve(apiClient(config));
    } else {
      reject(new Error("Token refresh failed"));
    }
  });
  requestQueue.length = 0;
}

// Response interceptor to handle auth errors and automatic refresh
apiClient.interceptors.response.use(
  (response) => response,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (error: any) => {
    const originalRequest = error.config;

    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't retry if this is already a retry or if it's a refresh request
    if (originalRequest?._retry || originalRequest?.url?.includes("/auth/refresh")) {
      // Dispatch unauthorized event - user needs to re-login
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return Promise.reject(error);
    }

    // Mark this request as a retry
    if (originalRequest) {
      originalRequest._retry = true;
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        requestQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    // Start refreshing
    isRefreshing = true;

    try {
      // Create a single refresh promise to prevent race conditions
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken();
      }

      const success = await refreshPromise;
      refreshPromise = null;
      isRefreshing = false;

      // Process any queued requests
      processQueue(success);

      if (success) {
        // Retry the original request
        return apiClient(originalRequest);
      } else {
        // Refresh failed - user needs to re-login
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        return Promise.reject(error);
      }
    } catch (refreshError) {
      refreshPromise = null;
      isRefreshing = false;
      processQueue(false);
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      return Promise.reject(refreshError);
    }
  }
);

/**
 * Manually trigger a token refresh.
 * Useful for proactively refreshing before the token expires.
 */
export async function refreshToken(): Promise<boolean> {
  return refreshAccessToken();
}

/**
 * Check if the user is authenticated by calling /auth/me.
 * Returns user data if authenticated, null otherwise.
 */
export async function checkAuth(): Promise<unknown | null> {
  try {
    const response = await apiClient.get("/auth/me");
    return response.data?.user || null;
  } catch {
    return null;
  }
}
