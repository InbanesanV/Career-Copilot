import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import UploadForm from "../components/UploadForm.jsx";
import apiClient from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

// ─── Feature highlight card ───────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, color }) {
  return (
    <div className="card flex flex-col gap-3 hover:border-slate-700 transition-colors duration-300">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const { userName } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(formData) {
    setIsLoading(true);
    setError(null);
    try {
      // JWT is attached automatically by the axios interceptor in client.js.
      // No userName field in the form — the backend identifies the user from the token.
      const res = await apiClient.post("/api/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Navigate to results page, passing data via route state
      navigate(`/results/${res.data._id}`, { state: { result: res.data } });
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-900/50 border border-brand-800 rounded-full text-brand-300 text-sm font-medium mb-6">
          <Sparkles size={13} />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-100 leading-tight tracking-tight mb-4">
          {userName ? `Welcome, ${userName}` : "Know exactly why your"}
          <br />
          <span className="bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
            {userName ? "Let's land that job" : "resume isn't landing the job"}
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your resume, paste a job description, and get an instant AI
          analysis — match score, skill gaps, and a personalized learning
          roadmap. Built for students who deserve a fair shot.
        </p>
      </div>

      {/* Main content: form + features */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Upload Form (wider column) */}
        <div className="lg:col-span-3 card animate-slide-up">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <Sparkles size={18} className="text-brand-400" />
            Analyze Your Resume
          </h2>

          {/* Error banner */}
          {error && (
            <div className="error-banner mb-5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <UploadForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Feature cards (narrower column) */}
        <div className="lg:col-span-2 space-y-4">
          <FeatureCard
            icon={Zap}
            title="Instant ATS Score"
            description="See in seconds how well your resume matches the job — the same way Applicant Tracking Systems evaluate it."
            color="bg-brand-600"
          />
          <FeatureCard
            icon={AlertCircle}
            title="Skill Gap Analysis"
            description="Identify exactly which skills the employer wants that your resume doesn't mention — no guessing."
            color="bg-violet-600"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Actionable Roadmap"
            description="Get specific, skill-linked steps to close your gaps — not vague advice, but real next actions."
            color="bg-emerald-600"
          />
          <FeatureCard
            icon={Users}
            title="Track Your Progress"
            description="Analyze multiple times and see your match score improve on the History page as you build skills."
            color="bg-amber-600"
          />
        </div>
      </div>
    </div>
  );
}
