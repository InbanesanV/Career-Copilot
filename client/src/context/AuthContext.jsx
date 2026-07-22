import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "authToken";
const USER_KEY = "cc_user_name";

/**
 * AuthProvider — wraps the app and exposes auth state + actions.
 *
 * Persists token and userName to localStorage so auth survives page refreshes.
 * On mount, restores state from localStorage (if a token exists).
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [userName, setUserName] = useState(
    () => localStorage.getItem(USER_KEY) || ""
  );

  const isAuthenticated = Boolean(token);

  /**
   * Store the JWT and userName after a successful login/register.
   * @param {string} newToken
   * @param {string} newUserName
   */
  function login(newToken, newUserName) {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, newUserName);
    setToken(newToken);
    setUserName(newUserName);
  }

  /**
   * Clear auth state and localStorage. Called on logout or session expiry.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUserName("");
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context from any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
