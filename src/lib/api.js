// Developed By: Vishnukarthick K

import axios from "axios";
import { getToken, clearSession } from "./auth";
import { toast } from "./toast";
import { notifySessionExpired } from "./sessionExpired";

// Default to the same host the page was loaded from (not a hardcoded "localhost") so this
// works unchanged whether opened as http://localhost:3000 or http://<lan-ip>:3000 — "localhost"
// in another machine's browser would otherwise resolve to that machine, not this one.
const DEFAULT_API_BASE_URL = `http://${window.location.hostname}:5454/api`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response handling: 401/403 → clear the dead session and show the blocking
// "session expired" dialog (SessionExpiredModal, mounted at the app root) so the
// student gets a clear reason before being sent back to Login, instead of a silent
// redirect. Everything else surfaces an error snackbar (unless the caller opts out
// with `skipErrorToast: true`).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      clearSession();
      if (!window.location.pathname.endsWith("/login")) {
        notifySessionExpired();
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
