import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, LogIn, Eye, EyeOff, Sparkles } from "lucide-react";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Listen for errors bubbled up from GoogleSignInButton
  useEffect(() => {
    function handleGoogleError(e) {
      setError(e.detail);
    }
    window.addEventListener("google-auth-error", handleGoogleError);
    return () =>
      window.removeEventListener("google-auth-error", handleGoogleError);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userName.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.post("/api/auth/login", {
        userName: userName.trim(),
        password,
      });
      login(res.data.token, res.data.user.userName);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-100">
              Career Copilot
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your resume analyses and progress history.
          </p>
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {/* Error banner */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label htmlFor="loginUserName" className="label">
                Username
              </label>
              <input
                id="loginUserName"
                type="text"
                autoComplete="username"
                className="input-field"
                placeholder="Your username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="loginPassword" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="input-field pr-11"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="loginBtn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <>
                  <LogIn size={17} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 uppercase tracking-wider">
              or
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <GoogleSignInButton text="signin_with" />
        </div>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
