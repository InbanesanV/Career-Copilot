import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * If the user is not authenticated, redirects to /login.
 * If authenticated, renders children as-is.
 *
 * Usage in App.jsx:
 *   <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
