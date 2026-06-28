const DEFAULT_BACKEND_ORIGIN = "http://localhost:3001";
export const BACKEND_ORIGIN = String(import.meta.env.VITE_BACKEND_ORIGIN || DEFAULT_BACKEND_ORIGIN).replace(/\/+$/, "");

export function resolveMediaUrl(value) {
  if (!value) {
    return "";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = String(value).startsWith("/") ? value : `/${value}`;
  return `${BACKEND_ORIGIN}${normalizedPath}`;
}
