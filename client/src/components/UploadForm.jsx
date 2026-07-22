import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  Briefcase,
  AlignLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";

/**
 * UploadForm — collects jobTitle, resume file, and jobDescription.
 * The user is identified from their JWT — no userName field needed.
 * Calls onSubmit(formData) and receives isLoading from parent.
 */
export default function UploadForm({ onSubmit, isLoading }) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // ── Validation ───────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!jobTitle.trim()) errs.jobTitle = "Job title is required.";
    if (!file) errs.file = "Please upload your resume (PDF or DOCX).";
    if (!jobDescription.trim())
      errs.jobDescription = "Job description is required.";
    else if (jobDescription.trim().length < 20)
      errs.jobDescription =
        "Please provide a more complete job description (at least 20 characters).";
    return errs;
  }

  // ── File handling ────────────────────────────────────────────────────────
  function handleFileChange(selectedFile) {
    if (!selectedFile) return;
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(selectedFile.type)) {
      setErrors((e) => ({
        ...e,
        file: "Only PDF or DOCX files are accepted.",
      }));
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors((e) => ({ ...e, file: "File must be smaller than 10 MB." }));
      return;
    }
    setFile(selectedFile);
    setErrors((e) => ({ ...e, file: undefined }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const formData = new FormData();
    formData.append("jobTitle", jobTitle.trim());
    formData.append("jobDescription", jobDescription.trim());
    formData.append("resume", file);
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Job Title */}
      <div>
        <label htmlFor="jobTitle" className="label">
          <Briefcase size={14} className="inline mr-1.5 -mt-0.5" />
          Target Job Title
        </label>
        <input
          id="jobTitle"
          type="text"
          className={`input-field ${errors.jobTitle ? "border-red-600 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          placeholder="e.g. Software Engineer"
          value={jobTitle}
          onChange={(e) => {
            setJobTitle(e.target.value);
            if (errors.jobTitle)
              setErrors((er) => ({ ...er, jobTitle: undefined }));
          }}
          disabled={isLoading}
        />
        {errors.jobTitle && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.jobTitle}
          </p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="label">
          <FileText size={14} className="inline mr-1.5 -mt-0.5" />
          Resume
        </label>
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          onKeyDown={(e) =>
            e.key === "Enter" && !isLoading && fileInputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 
            ${dragOver ? "border-brand-400 bg-brand-900/20" : "border-slate-700 hover:border-brand-600 hover:bg-slate-800/40"}
            ${errors.file ? "border-red-700" : ""}
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="resumeFile"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files[0])}
            disabled={isLoading}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={22} className="text-brand-400 shrink-0" />
              <span className="text-sm text-slate-200 font-medium truncate max-w-xs">
                {file.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload
                size={28}
                className="mx-auto text-slate-500 group-hover:text-brand-400"
              />
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-brand-400">
                  Click to upload
                </span>{" "}
                or drag &amp; drop
              </p>
              <p className="text-xs text-slate-600">PDF or DOCX · Max 10 MB</p>
            </div>
          )}
        </div>
        {errors.file && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.file}
          </p>
        )}
      </div>

      {/* Job Description */}
      <div>
        <label htmlFor="jobDescription" className="label">
          <AlignLeft size={14} className="inline mr-1.5 -mt-0.5" />
          Job Description
        </label>
        <textarea
          id="jobDescription"
          rows={8}
          className={`input-field resize-y min-h-[140px] ${errors.jobDescription ? "border-red-600 focus:border-red-500 focus:ring-red-500/20" : ""}`}
          placeholder="Paste the full job description here — the more detail, the better the analysis…"
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            if (errors.jobDescription)
              setErrors((er) => ({ ...er, jobDescription: undefined }));
          }}
          disabled={isLoading}
        />
        {errors.jobDescription && (
          <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.jobDescription}
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-600 text-right">
          {jobDescription.length} characters
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        id="analyzeBtn"
        disabled={isLoading}
        className="btn-primary w-full py-3.5 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing your resume…
          </>
        ) : (
          <>
            <Upload size={18} />
            Analyze My Resume
          </>
        )}
      </button>
    </form>
  );
}
