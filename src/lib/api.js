import axios from "axios";
import { getToken, clearSession } from "./auth";
import { toast } from "./toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5454/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handling: 401/403 → session expired + redirect; everything else
// surfaces an error snackbar (unless the caller opts out with `skipErrorToast: true`).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      clearSession();
      if (window.location.pathname !== "/login") {
        toast.info("Your session has expired. Please sign in again.");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
    if (!error?.config?.skipErrorToast) {
      const msg =
        error?.response?.data?.message ||
        (error?.code === "ERR_NETWORK"
          ? "Can't reach the server. Please check your connection."
          : "Something went wrong. Please try again.");
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

// Unwraps the backend ApiResponse<T> envelope { success, message, data }.
export function unwrap(promise) {
  return promise.then((res) => res.data?.data);
}

export default api;
