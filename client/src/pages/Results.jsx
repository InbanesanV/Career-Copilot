import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  History,
  AlertCircle,
  Loader2,
  CalendarDays,
  Briefcase,
  User,
  DatabaseBackup,
  FileText,
} from "lucide-react";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import ScoreGauge from "../components/ScoreGauge.jsx";
import SkillTags from "../components/SkillTags.jsx";
import RoadmapChecklist from "../components/RoadmapChecklist.jsx";

// ─── Results Page ─────────────────────────────────────────────────────────────
export default function Results() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { userName } = useAuth();

  const [result, setResult] = useState(state?.result || null);
  const [isLoading, setIsLoading] = useState(!state?.result);
  const [error, setError] = useState(null);

  // If the user navigates directly to /results/:id (e.g. from History),
  // we don't have route state so we can't refetch a single doc easily.
  // For now show a helpful message; a GET /api/analysis/:id endpoint
  // could be added in a future iteration.
  useEffect(() => {
    if (!state?.result && id) {
      setIsLoading(false);
      setError(
        "Result data not available. Please run a new analysis from the home page."
      );
    }
  }, [state, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 size={40} className="animate-spin text-brand-400" />
          <p className="text-sm">Loading your results…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="error-banner justify-center mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
        <button onClick={() => navigate("/")} className="btn-primary">
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </div>
    );
  }

  if (!result) return null;

  const dateStr = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="btn-secondary text-sm py-2 px-4"
      >
        <ArrowLeft size={15} />
        New Analysis
      </button>

      {/* Warn when DB write failed — result was returned but not persisted */}
      {result.savedToHistory === false && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-sm">
          <DatabaseBackup size={18} className="shrink-0 mt-0.5" />
          <span>
            Your analysis is shown below but{" "}
            <strong>could not be saved to history</strong> due to a temporary
            database issue. You can still view these results now — try running
            the analysis again later to save it.
          </span>
        </div>
      )}

      {/* Header card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <User size={14} />
              <span>{result.userName || userName}</span>
            </div>
            <h1 className="section-title flex items-center gap-2">
              <Briefcase size={22} className="text-brand-400" />
              {result.jobTitle}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays size={12} />
              {dateStr}
            </div>
          </div>

          {/* Score gauge */}
          <div className="sm:min-w-[200px]">
            <ScoreGauge score={result.matchScore} />
          </div>
        </div>
      </div>

      {/* Skills card */}
      <div className="card animate-slide-up">
        <h2 className="section-title text-lg mb-5">Skills Analysis</h2>
        <SkillTags
          matchedSkills={result.matchedSkills}
          missingSkills={result.missingSkills}
        />
      </div>

      {/* Roadmap card */}
      <div className="card animate-slide-up">
        <h2 className="section-title text-lg mb-5">Your Learning Roadmap</h2>
        <RoadmapChecklist steps={result.roadmap} />
      </div>

      {/* Template suggestion card — Feature 2 */}
      {result.templateSuggestion?.style && (
        <div className="animate-slide-up rounded-2xl p-6 shadow-xl border border-brand-800/60 bg-brand-950/40 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-brand-300 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-brand-400" />
            Recommended Format
          </h2>
          <div className="space-y-2">
            <p className="text-xl font-extrabold text-brand-100 tracking-tight">
              {result.templateSuggestion.style}
            </p>
            {result.templateSuggestion.reason && (
              <p className="text-sm text-brand-300/80 leading-relaxed">
                {result.templateSuggestion.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          to="/history"
          className="btn-secondary flex-1 justify-center"
          id="viewHistoryBtn"
        >
          <History size={16} />
          View Progress History
        </Link>
        <button
          onClick={() => navigate("/")}
          className="btn-primary flex-1 justify-center"
        >
          <ArrowLeft size={16} />
          Analyze Another Resume
        </button>
      </div>
    </div>
  );
}
