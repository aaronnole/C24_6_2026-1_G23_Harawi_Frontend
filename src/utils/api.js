import { BACKEND_ORIGIN } from "./mediaUrl";

function normalizeApiBaseUrl(value) {
  const baseUrl = String(value || `${BACKEND_ORIGIN}/api`).replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const SOCKET_URL = String(import.meta.env.VITE_SOCKET_URL || BACKEND_ORIGIN).replace(/\/+$/, "");

export function buildApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
