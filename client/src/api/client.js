import axios from "axios";

const TOKEN_KEY = "authToken";
const USER_KEY = "cc_user_name";

// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  timeout: 60000, // 60 s — Gemini can be slow on first call
});

// ─── Request interceptor — attach JWT from localStorage ───────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — normalize errors + handle session expiry ──────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    // 401 → session expired or not logged in → clear storage + redirect to login
    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Use window.location to redirect outside of React Router context
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const message =
      err.response?.data?.error ||
      err.message ||
      "An unexpected error occurred. Please try again.";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
