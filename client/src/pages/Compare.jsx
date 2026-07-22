import { useState, useEffect } from "react";
import {
  AlertCircle,
  Loader2,
  GitCompareArrows,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PlusCircle,
} from "lucide-react";
import apiClient from "../api/client.js";

// ─── Skill chip ───────────────────────────────────────────────────────────────
function Chip({ label, variant }) {
  const styles = {
    green:
      "bg-emerald-900/50 text-emerald-300 border border-emerald-800/60",
    red: "bg-red-900/50 text-red-300 border border-red-800/60",
    yellow:
      "bg-amber-900/50 text-amber-300 border border-amber-800/60",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${styles[variant]}`}
    >
      {label}
    </span>
  );
}

// ─── Score change badge ───────────────────────────────────────────────────────
function ScoreDelta({ from, to, delta }) {
  const improved = delta > 0;
  const neutral = delta === 0;
  const Icon = improved ? TrendingUp : neutral ? Minus : TrendingDown;
  const color = improved
    ? "text-emerald-400"
    : neutral
    ? "text-slate-400"
    : "text-red-400";
  const bg = improved
    ? "bg-emerald-950/40 border-emerald-800"
    : neutral
    ? "bg-slate-800 border-slate-700"
    : "bg-red-950/40 border-red-800";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-4 rounded-2xl border p-6 ${bg}`}
    >
      <div className="text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Earlier
        </p>
        <p className="text-4xl font-extrabold text-slate-200">{from}</p>
        <p className="text-xs text-slate-600 mt-0.5">/ 100</p>
      </div>

      <div className={`flex flex-col items-center gap-1 ${color}`}>
        <Icon size={28} />
        <p className={`text-lg font-bold ${color}`}>
          {delta > 0 ? `+${delta}` : delta} pts
        </p>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Recent
        </p>
        <p className="text-4xl font-extrabold text-slate-200">{to}</p>
        <p className="text-xs text-slate-600 mt-0.5">/ 100</p>
      </div>
    </div>
  );
}

// ─── Helper — format a date for dropdown labels ───────────────────────────────
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Compare Page ─────────────────────────────────────────────────────────────
// ProtectedRoute guarantees the user is authenticated before this mounts.
export default function ComparePage() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  const [result, setResult] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareError, setCompareError] = useState(null);

  // ── Load history to populate dropdowns ──────────────────────────────────
  useEffect(() => {
    setHistoryLoading(true);
    // JWT is attached automatically by the axios interceptor
    apiClient
      .get("/api/history")
      .then((res) => {
        setHistory(res.data); // already sorted newest-first by server
        setHistoryLoading(false);
      })
      .catch((err) => {
        setHistoryError(err.message);
        setHistoryLoading(false);
      });
  }, []);

  // ── Run comparison ────────────────────────────────────────────────────────
  async function handleCompare() {
    if (!fromId || !toId) return;
    setComparing(true);
    setCompareError(null);
    setResult(null);

    try {
      const res = await apiClient.get(
        `/api/history/compare?fromId=${encodeURIComponent(fromId)}&toId=${encodeURIComponent(toId)}`
      );
      setResult(res.data);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setComparing(false);
    }
  }

  // ── Need at least 2 analyses to compare ───────────────────────────────────
  const canCompare = history.length >= 2;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title flex items-center gap-2.5 mb-1">
            <GitCompareArrows size={26} className="text-brand-400" />
            Compare Progress
          </h1>
          <p className="text-slate-500 text-sm">
            Pick two of your past analyses to see what changed.
          </p>
        </div>
      </div>

      {/* History loading / error */}
      {historyLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 size={36} className="animate-spin text-brand-400" />
            <p className="text-sm">Loading your analyses…</p>
          </div>
        </div>
      )}

      {historyError && (
        <div className="error-banner">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{historyError}</span>
        </div>
      )}

      {/* Not enough analyses */}
      {!historyLoading && !historyError && !canCompare && (
        <div className="card text-center py-12 space-y-3">
          <GitCompareArrows size={36} className="mx-auto text-slate-700" />
          <h3 className="text-slate-400 font-semibold">Not enough data yet</h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            You need at least 2 saved analyses to compare. Run another analysis
            against a different job description and come back.
          </p>
        </div>
      )}

      {/* Dropdown selector */}
      {!historyLoading && canCompare && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <ArrowRight size={16} className="text-brand-400" />
            Select two analyses to compare
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earlier */}
            <div>
              <label
                htmlFor="fromSelect"
                className="label"
              >
                Earlier analysis
              </label>
              <select
                id="fromSelect"
                value={fromId}
                onChange={(e) => {
                  setFromId(e.target.value);
                  setResult(null);
                  setCompareError(null);
                }}
                className="input-field"
              >
                <option value="">— pick one —</option>
                {history.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.jobTitle} · {a.matchScore}% · {fmtDate(a.createdAt)}
                  </option>
                ))}
              </select>
            </div>

            {/* Recent */}
            <div>
              <label
                htmlFor="toSelect"
                className="label"
              >
                Recent analysis
              </label>
              <select
                id="toSelect"
                value={toId}
                onChange={(e) => {
                  setToId(e.target.value);
                  setResult(null);
                  setCompareError(null);
                }}
                className="input-field"
              >
                <option value="">— pick one —</option>
                {history.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.jobTitle} · {a.matchScore}% · {fmtDate(a.createdAt)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            id="compareBtn"
            onClick={handleCompare}
            disabled={!fromId || !toId || fromId === toId || comparing}
            className="btn-primary w-full justify-center"
          >
            {comparing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Comparing…
              </>
            ) : (
              <>
                <GitCompareArrows size={16} />
                Compare
              </>
            )}
          </button>

          {fromId && toId && fromId === toId && (
            <p className="text-xs text-amber-400 text-center -mt-2">
              Please select two different analyses.
            </p>
          )}
        </div>
      )}

      {/* Compare error */}
      {compareError && (
        <div className="error-banner">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{compareError}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Score delta */}
          <div className="card">
            <h2 className="font-semibold text-slate-200 mb-1 text-sm uppercase tracking-wider">
              Score Change
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              {result.from.jobTitle} → {result.to.jobTitle}
            </p>
            <ScoreDelta
              from={result.from.matchScore}
              to={result.to.matchScore}
              delta={result.scoreDelta}
            />
          </div>

          {/* Closed gaps */}
          <div className="card">
            <h2 className="font-semibold text-emerald-300 mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} />✅ Gaps you closed
            </h2>
            {result.closedGaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.closedGaps.map((skill) => (
                  <Chip key={skill} label={skill} variant="green" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                None yet — keep going!
              </p>
            )}
          </div>

          {/* Persistent gaps */}
          <div className="card">
            <h2 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
              <XCircle size={18} />⚠️ Still missing
            </h2>
            {result.persistentGaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.persistentGaps.map((skill) => (
                  <Chip key={skill} label={skill} variant="red" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No persistent gaps — great progress!
              </p>
            )}
          </div>

          {/* New gaps — only shown when present */}
          {result.newGaps.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-amber-300 mb-1 flex items-center gap-2">
                <PlusCircle size={18} />🆕 New gaps
              </h2>
              <p className="text-xs text-slate-600 mb-3">
                These gaps appeared because the second job description required
                skills the earlier one didn't — not necessarily a step back.
              </p>
              <div className="flex flex-wrap gap-2">
                {result.newGaps.map((skill) => (
                  <Chip key={skill} label={skill} variant="yellow" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
