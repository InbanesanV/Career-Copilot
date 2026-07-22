import { useState } from "react";
import { CheckSquare, Square, MapPin } from "lucide-react";

/**
 * RoadmapChecklist — numbered, interactive checklist of roadmap steps.
 * Checked state is local only (visual feedback, no persistence needed).
 */
export default function RoadmapChecklist({ steps = [] }) {
  const [checked, setChecked] = useState(() => steps.map(() => false));

  function toggle(index) {
    setChecked((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  if (steps.length === 0) {
    return (
      <p className="text-sm text-slate-500 italic">
        No roadmap generated — your resume already looks strong!
      </p>
    );
  }

  const completedCount = checked.filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-400" />
          Your improvement roadmap
        </div>
        <span className="font-medium text-brand-400">
          {completedCount}/{steps.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
          style={{
            width: steps.length > 0 ? `${(completedCount / steps.length) * 100}%` : "0%",
          }}
        />
      </div>

      {/* Steps */}
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 group
                ${
                  checked[i]
                    ? "bg-emerald-950/30 border-emerald-800/50"
                    : "bg-slate-800/50 border-slate-700/50 hover:border-brand-700/60 hover:bg-slate-800"
                }
              `}
            >
              {/* Step number / check icon */}
              <div
                className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                  ${
                    checked[i]
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-700 text-slate-400 group-hover:bg-brand-800 group-hover:text-brand-300"
                  }
                `}
              >
                {checked[i] ? (
                  <CheckSquare size={14} />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              <span
                className={`text-sm leading-relaxed transition-colors ${
                  checked[i]
                    ? "text-slate-500 line-through"
                    : "text-slate-200 group-hover:text-white"
                }`}
              >
                {step}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
