/**
 * ScoreGauge — displays a circular SVG gauge showing the match score (0–100).
 * Color-coded: red (<50), amber (50-75), green (>75).
 */
export default function ScoreGauge({ score }) {
  const clampedScore = Math.min(100, Math.max(0, score ?? 0));

  // SVG arc parameters
  const radius = 72;
  const strokeWidth = 10;
  const cx = 90;
  const cy = 90;
  const circumference = Math.PI * radius; // half-circle (180°)

  // We draw a semi-circle from 180° to 0° (left → right)
  const offset = circumference - (clampedScore / 100) * circumference;

  // Color zones
  let trackColor, labelColor, scoreLabel;
  if (clampedScore < 50) {
    trackColor = "#ef4444"; // red-500
    labelColor = "text-red-400";
    scoreLabel = "Needs Work";
  } else if (clampedScore <= 75) {
    trackColor = "#f59e0b"; // amber-500
    labelColor = "text-amber-400";
    scoreLabel = "Good Match";
  } else {
    trackColor = "#10b981"; // emerald-500
    labelColor = "text-emerald-400";
    scoreLabel = "Strong Match";
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* SVG Semi-circle gauge */}
      <div className="relative w-48 h-28 overflow-hidden">
        <svg
          viewBox="0 0 180 100"
          className="w-full h-full"
          aria-label={`Match score: ${clampedScore} out of 100`}
        >
          {/* Background track */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)",
              filter: `drop-shadow(0 0 8px ${trackColor}88)`,
            }}
          />
        </svg>

        {/* Score text, centred inside the arc */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span
            className={`text-4xl font-extrabold leading-none tracking-tight ${labelColor}`}
          >
            {clampedScore}
          </span>
          <span className="text-xs text-slate-500 font-medium mt-0.5">
            / 100
          </span>
        </div>
      </div>

      {/* Label */}
      <div
        className={`px-4 py-1 rounded-full text-sm font-semibold border ${
          clampedScore < 50
            ? "bg-red-950/50 text-red-400 border-red-800"
            : clampedScore <= 75
            ? "bg-amber-950/50 text-amber-400 border-amber-800"
            : "bg-emerald-950/50 text-emerald-400 border-emerald-800"
        }`}
      >
        {scoreLabel}
      </div>

      {/* Progress bar (secondary visual) */}
      <div className="w-full max-w-xs mt-1">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${clampedScore}%`,
              backgroundColor: trackColor,
              boxShadow: `0 0 10px ${trackColor}66`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
