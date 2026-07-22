import { CheckCircle2, XCircle } from "lucide-react";

/**
 * SkillTags — renders two columns of skill badges:
 *   - Matched Skills (green)
 *   - Missing Skills (red)
 */
export default function SkillTags({ matchedSkills = [], missingSkills = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Matched Skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <h3 className="font-semibold text-slate-200">
            Matched Skills
            <span className="ml-2 text-xs text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-800">
              {matchedSkills.length}
            </span>
          </h3>
        </div>
        {matchedSkills.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No matching skills found.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill, i) => (
              <span key={i} className="badge-green">
                <CheckCircle2 size={12} />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Missing Skills */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={18} className="text-red-400 shrink-0" />
          <h3 className="font-semibold text-slate-200">
            Missing Skills
            <span className="ml-2 text-xs text-red-400 bg-red-950/50 px-2 py-0.5 rounded-full border border-red-800">
              {missingSkills.length}
            </span>
          </h3>
        </div>
        {missingSkills.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No critical skill gaps found — great work!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill, i) => (
              <span key={i} className="badge-red">
                <XCircle size={12} />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
