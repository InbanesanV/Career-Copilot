import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2, Sparkles, Hash, GraduationCap } from "lucide-react";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * CompleteGoogleProfile — shown after Google Sign-In for a brand-new user.
 *
 * Navigation state from GoogleSignInButton:
 *   { googleId, suggestedUserName, email }
 *
 * Collects registerNumber + collegeName (and lets them edit the suggested
 * username), then POSTs to /api/auth/google/complete-profile to create the
 * account and receive a JWT.
 */
export default function CompleteGoogleProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();

  // Guard: if user lands here without Google state, send them to register
  if (!state?.googleId) {
    navigate("/register", { replace: true });
    return null;
  }

  const [userName, setUserName] = useState(state.suggestedUserName || "");
  const [registerNumber, setRegisterNumber] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!userName.trim()) errs.userName = "Username is required.";
    if (!registerNumber.trim())
      errs.registerNumber = "Register number is required.";
    if (!collegeName.trim()) errs.collegeName = "College name is required.";
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
      const res = await apiClient.post("/api/auth/google/complete-profile", {
        googleId: state.googleId,
        userName: userName.trim(),
        registerNumber: registerNumber.trim(),
        collegeName: collegeName.trim(),
      });
      login(res.data.token, res.data.user.userName);
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-900/50">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-100">
              Career Copilot
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Just a few more details to finish setting up your account.
          </p>
          {state.email && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-900/30 border border-emerald-800/50 rounded-full text-emerald-400 text-xs">
              <CheckCircle2 size={13} />
              Signed in as {state.email}
            </div>
          )}
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {serverError && (
            <div className="error-banner">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username (pre-filled, editable) */}
            <div>
              <label htmlFor="cpUserName" className="label">
                Username
              </label>
              <input
                id="cpUserName"
                type="text"
                className={`input-field ${
                  errors.userName
                    ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
                placeholder="Choose a unique username"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errors.userName)
                    setErrors((er) => ({ ...er, userName: undefined }));
                }}
                disabled={isLoading}
              />
              {errors.userName && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.userName}
                </p>
              )}
            </div>

            {/* Register Number */}
            <div>
              <label htmlFor="cpRegNumber" className="label">
                <Hash size={14} className="inline mr-1.5 -mt-0.5" />
                Register Number
              </label>
              <input
                id="cpRegNumber"
                type="text"
                className={`input-field ${
                  errors.registerNumber
                    ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
                placeholder="Your college register number"
                value={registerNumber}
                onChange={(e) => {
                  setRegisterNumber(e.target.value);
                  if (errors.registerNumber)
                    setErrors((er) => ({ ...er, registerNumber: undefined }));
                }}
                disabled={isLoading}
              />
              {errors.registerNumber && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.registerNumber}
                </p>
              )}
            </div>

            {/* College Name */}
            <div>
              <label htmlFor="cpCollege" className="label">
                <GraduationCap size={14} className="inline mr-1.5 -mt-0.5" />
                College Name
              </label>
              <input
                id="cpCollege"
                type="text"
                className={`input-field ${
                  errors.collegeName
                    ? "border-red-600 focus:border-red-500 focus:ring-red-500/20"
                    : ""
                }`}
                placeholder="Your college / university"
                value={collegeName}
                onChange={(e) => {
                  setCollegeName(e.target.value);
                  if (errors.collegeName)
                    setErrors((er) => ({ ...er, collegeName: undefined }));
                }}
                disabled={isLoading}
              />
              {errors.collegeName && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.collegeName}
                </p>
              )}
            </div>

            <button
              id="completeProfileBtn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? (
                <span className="spinner" />
              ) : (
                "Finish & Enter Career Copilot →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
