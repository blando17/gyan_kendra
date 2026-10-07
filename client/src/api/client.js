import axios from "axios";

const TOKEN_KEY = "gyankendra.token";

// The JWT is kept in localStorage and attached as a bearer header, matching
// the server's authenticateToken middleware.
export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // A blocked store only means the session will not survive a reload.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ""}/api`,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// An expired or tampered token should drop the session rather than leave the
// app half-logged-in.
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    const isAuthCall = error?.config?.url?.includes("/auth/");

    if ((status === 401 || status === 403) && !isAuthCall) {
      tokenStore.clear();

      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

// Turns any failure into one sentence a user can act on.
export function errorMessage(error, fallback = "Something went wrong.") {
  if (error?.response?.data?.message) return error.response.data.message;

  if (error?.code === "ERR_NETWORK") return "Could not reach the server.";

  return fallback;
}

export default api;
