// src/lib/config.ts
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (import.meta.env.PROD && !envApiBaseUrl?.trim()) {
  throw new Error("VITE_API_BASE_URL must be set in production.");
}

export const API_BASE_URL = envApiBaseUrl?.trim() || "http://localhost:8081/api/creatorshub";
