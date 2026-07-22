import { useState, useEffect } from "react";
import {
  AlertCircle,
  Loader2,
  History,
  CalendarDays,
  Briefcase,
  TrendingUp,
  InboxIcon,
  RefreshCw,
  GitCompareArrows,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Link } from "react-router-dom";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    let color = "#ef4444";
    if (score > 75) color = "#10b981";
    else if (score >= 50) color = "#f59e0b";

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        <p className="font-bold" style={{ color }}>
          Match Score: {score}/100
        </p>
        {payload[0].payload.jobTitle && (
          <p className="text-slate-500 text-xs mt-0.5">
            {payload[0].payload.jobTitle}
          </p>
        )}
      </div>
    );
  }
  return null;
}

// ─── Single history entry card ────────────────────────────────────────────────
function HistoryCard({ analysis, index }) {
  const score = analysis.matchScore;
  let scoreColor = "text-red-400";
  let scoreBg = "bg-red-950/40 border-red-800";
  if (score > 75) {
    scoreColor = "text-emerald-400";
    scoreBg = "bg-emerald-950/40 border-emerald-800";
  } else if (score >= 50) {
    scoreColor = "text-amber-400";
    scoreBg = "bg-amber-950/40 border-amber-800";
  }

  const dateStr = new Date(analysis.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="card flex flex-col sm:flex-row sm:items-center gap-4 hover:border-slate-700 transition-colors duration-200 animate-slide-up">
      {/* Index */}
      <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400">
        {index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <Briefcase size={14} className="text-brand-400 shrink-0" />
          <span className="truncate">{analysis.jobTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
          <CalendarDays size={11} />
          {dateStr}
        </div>
        {/* Skill preview */}
        {analysis.missingSkills?.length > 0 && (
          <p className="mt-1.5 text-xs text-slate-600 truncate">
            Missing: {analysis.missingSkills.slice(0, 3).join(", ")}
            {analysis.missingSkills.length > 3
              ? ` +${analysis.missingSkills.length - 3} more`
              : ""}
          </p>
        )}
      </div>

      {/* Score badge */}
      <div
        className={`shrink-0 px-4 py-2 rounded-xl border text-center min-w-[72px] ${scoreBg}`}
      >
        <span className={`text-2xl font-extrabold ${scoreColor}`}>{score}</span>
        <p className="text-xs text-slate-600 -mt-0.5">/ 100</p>
      </div>
    </div>
  );
}

// ─── History Page ───────────────────────────────────────────────────────────────
// ProtectedRoute guarantees the user is authenticated before this mounts.
export default function HistoryPage() {
  const { userName } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  async function fetchHistory() {
    setIsLoading(true);
    setError(null);
    try {
      // JWT is attached automatically by the axios interceptor
      const res = await apiClient.get("/api/history");
      setAnalyses(res.data);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prepare chart data — oldest first for chronological display
  const chartData = [...analyses]
    .reverse()
    .map((a) => ({
      date: new Date(a.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      score: a.matchScore,
      jobTitle: a.jobTitle,
    }));

  const avgScore =
    analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.matchScore, 0) / analyses.length)
      : 0;

  const bestScore =
    analyses.length > 0 ? Math.max(...analyses.map((a) => a.matchScore)) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2.5 mb-1">
            <History size={24} className="text-brand-400" />
            Progress History
          </h1>
          <p className="text-slate-500 text-sm">
            Viewing history for{" "}
            <span className="text-slate-300 font-medium">{userName}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/compare"
            id="compareProgressBtn"
            className="btn-secondary text-sm py-2 px-4"
          >
            <GitCompareArrows size={14} />
            Compare
          </Link>
          <button
            id="refreshHistoryBtn"
            onClick={fetchHistory}
            disabled={isLoading}
            className="btn-secondary text-sm py-2 px-4"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            {isLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !loaded && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={36} className="animate-spin text-brand-400" />
            <p className="text-sm">Loading your history…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {loaded && !isLoading && (
        <>
          {analyses.length === 0 ? (
            /* Empty state */
            <div className="card text-center py-16 space-y-3">
              <InboxIcon size={40} className="mx-auto text-slate-700" />
              <h3 className="text-slate-400 font-semibold text-lg">
                No analyses yet
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Run your first analysis from the home page and it will appear
                here!
              </p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Analyses", value: analyses.length, icon: TrendingUp, color: "text-brand-400" },
                  { label: "Average Score", value: `${avgScore}/100`, icon: History, color: "text-amber-400" },
                  { label: "Best Score", value: `${bestScore}/100`, icon: TrendingUp, color: "text-emerald-400" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card text-center py-4 px-3">
                    <Icon size={18} className={`mx-auto mb-1.5 ${color}`} />
                    <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="card">
                  <h2 className="font-semibold text-slate-200 mb-5 flex items-center gap-2">
                    <TrendingUp size={18} className="text-brand-400" />
                    Score Over Time
                  </h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={{ stroke: "#334155" }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Reference lines for thresholds */}
                      <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />
                      <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0ea5e9"
                        strokeWidth={2.5}
                        dot={{ fill: "#0ea5e9", r: 4, strokeWidth: 2, stroke: "#0c4a6e" }}
                        activeDot={{ r: 6, fill: "#38bdf8" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Dashed lines: 50 (red) and 75 (green) thresholds
                  </p>
                </div>
              )}

              {/* History list */}
              <div className="space-y-3">
                <h2 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">
                  All Analyses
                </h2>
                {analyses.map((a, i) => (
                  <HistoryCard key={a._id} analysis={a} index={i} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
