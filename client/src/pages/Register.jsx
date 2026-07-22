import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Hash,
  GraduationCap,
  Lock,
} from "lucide-react";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    userName: "",
    registerNumber: "",
    collegeName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Listen for errors bubbled up from GoogleSignInButton
  useEffect(() => {
    function handleGoogleError(e) {
      setServerError(e.detail);
    }
    window.addEventListener("google-auth-error", handleGoogleError);
    return () =>
      window.removeEventListener("google-auth-error", handleGoogleError);
  }, []);

  function update(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    };
  }

  function validate() {
    const errs = {};
    if (!form.userName.trim()) errs.userName = "Username is required.";
    if (!form.registerNumber.trim())
      errs.registerNumber = "Register number is required.";
    if (!form.collegeName.trim())
      errs.collegeName = "College name is required.";
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword)
      errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await apiClient.post("/api/auth/register", {
        userName: form.userName.trim(),
        registerNumber: form.registerNumber.trim(),
        collegeName: form.collegeName.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      login(res.data.token, res.data.user.userName);
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const fields = [
    {
      id: "regUserName",
      key: "userName",
      label: "Username",
      icon: User,
      type: "text",
      placeholder: "Choose a unique username",
      autoComplete: "username",
    },
    {
      id: "regNumber",
      key: "registerNumber",
      label: "Register Number",
      icon: Hash,
      type: "text",
      placeholder: "Your college register number",
      autoComplete: "off",
    },
    {
      id: "regCollege",
      key: "collegeName",
      label: "College Name",
      icon: GraduationCap,
      type: "text",
      placeholder: "Your college / university",
      autoComplete: "organization",
    },
  ];

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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Start tracking your resume progress and closing skill gaps.
          </p>
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {/* Server error banner */}
          {serverError && (
            <div className="error-banner">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Text fields */}
            {fields.map(({ id, key, label, icon: Icon, type, placeholder, autoComplete }) => (
              <div key={key}>
                <label htmlFor={id} className="label">
                  <Icon size={14} className="inline mr-1.5 -mt-0.5" />
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  autoComplete={autoComplete}
                  className={`input-field ${
                    errors[key]
                      ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={update(key)}
                  disabled={isLoading}
                />
                {errors[key] && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}

            {/* Password */}
            <div>
              <label htmlFor="regPassword" className="label">
                <Lock size={14} className="inline mr-1.5 -mt-0.5" />
                Password
              </label>
              <div className="relative">
                <input
                  id="regPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input-field pr-11 ${
                    errors.password
                      ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={update("password")}
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
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="regConfirmPassword" className="label">
                <Lock size={14} className="inline mr-1.5 -mt-0.5" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="regConfirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className={`input-field pr-11 ${
                    errors.confirmPassword
                      ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                      : ""
                  }`}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              id="registerBtn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                <>
                  <UserPlus size={17} />
                  Create Account
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

          <GoogleSignInButton text="signup_with" />
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
