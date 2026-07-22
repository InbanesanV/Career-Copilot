import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import {
  Briefcase,
  History,
  Sparkles,
  GitCompareArrows,
  LogOut,
  User,
} from "lucide-react";

import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import HistoryPage from "./pages/History.jsx";
import ComparePage from "./pages/Compare.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CompleteGoogleProfile from "./pages/CompleteGoogleProfile.jsx";

// ─── Top Navigation ───────────────────────────────────────────────────────────
function Navbar() {
  const { isAuthenticated, userName, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-brand-600/20 text-brand-400"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          
          <span className="font-bold text-lg text-slate-100 group-hover:text-brand-400 transition-colors">
            Career Copilot
          </span>
        </NavLink>

        {/* Nav links — only shown when authenticated */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <NavLink to="/" end className={navLinkClass}>
                <Briefcase size={15} />
                Analyze
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History size={15} />
                History
              </NavLink>
              <NavLink to="/compare" className={navLinkClass}>
                <GitCompareArrows size={15} />
                Compare
              </NavLink>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-700 mx-1" />

              {/* User display */}
              <div className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400">
                <User size={14} />
                <span className="max-w-[120px] truncate">{userName}</span>
              </div>

              {/* Logout */}
              <button
                id="logoutBtn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all"
                title="Sign out"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Sign In
              </NavLink>
              <NavLink
                to="/register"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-500 transition-all"
              >
                Get Started
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/50 py-6 text-center text-xs text-slate-500">
      Built for Hackathon — Sustainability &amp; Social Impact · Skill Development
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* ── Public routes ────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/auth/complete-profile"
            element={<CompleteGoogleProfile />}
          />

          {/* ── Protected routes (require JWT) ───────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <ComparePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
