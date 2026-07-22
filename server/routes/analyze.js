const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { parseResume } = require("../utils/parseResume");
const Analysis = require("../models/Analysis");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

// ─── Multer — in-memory storage (no temp files on disk) ───────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Please upload a PDF or DOCX resume."
        ),
        false
      );
    }
  },
});

// ─── Gemini client ────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Maximum resume characters sent to Gemini.
const MAX_RESUME_CHARS = 8000;

function isQuotaError(err) {
  return err?.status === 429 || /quota|rate limit|too many requests/i.test(err?.message || "");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrompt(resumeText, jobDescription) {
  return `
You are an expert ATS (Applicant Tracking System) resume analyzer and career coach with 10+ years of technical recruiting experience.

TASK: Compare the candidate's resume against the job description and produce a precise, calculated match analysis.

STEP-BY-STEP PROCESS (do this internally, do not output your reasoning):

1. EXTRACT — Job Description Requirements
   Extract every skill, tool, technology, and qualification from the job description.
   Classify each as either "required" (must-have, explicitly stated as required/must-have,
   or clearly core to the role) or "preferred" (nice-to-have, mentioned as a plus/bonus).

2. EXTRACT — Resume Skills
   Extract every skill, tool, technology, and qualification mentioned anywhere in the resume
   (skills section, project descriptions, work experience, certifications).

3. NORMALIZE before comparing
   Treat these as the SAME skill (case-insensitive, ignore punctuation/suffixes):
   - "React", "React.js", "ReactJS" → one skill
   - "Node", "Node.js", "NodeJS" → one skill
   - "JS" and "JavaScript" → one skill
   - Apply this normalization logic to any similar variants you encounter.

4. MATCH — Compare normalized lists
   Mark a skill "matched" ONLY if it clearly appears in both lists after normalization.
   Do not infer skills that aren't explicitly stated (e.g., do not assume someone knows
   "Redux" just because they know "React"). Be strict.

5. CALCULATE matchScore using this exact formula:
   - Let R = total required skills from the JD
   - Let Rm = required skills that matched
   - Let P = total preferred skills from the JD
   - Let Pm = preferred skills that matched
   - requiredScore = (Rm / R) * 80   [if R is 0, treat requiredScore as 80]
   - preferredScore = (Pm / P) * 20   [if P is 0, treat preferredScore as 20]
   - matchScore = round(requiredScore + preferredScore), clamped between 0 and 100
   Show your calculation is internally consistent — do not output a number that
   contradicts the matched/missing lists you return.

6. IDENTIFY missing skills
   List every required or preferred skill from the JD with no match in the resume.
   Order this list by importance: required skills first, then preferred.

7. BUILD roadmap — 4 to 6 steps
   Each step must:
   - Reference exactly one specific missing skill by name
   - Prioritize required missing skills before preferred ones
   - Name a concrete action (a specific type of resource, project, or practice) —
     do not just say "learn X", say what to do with it
   Example of a good step: "Learn Docker by completing the official 'Get Started' tutorial,
   then containerize one of your existing Node.js projects and document it in your GitHub README."
   Example of a bad step (do not do this): "Improve your Docker skills."

8. RECOMMEND resume format
   Based on the job title and JD requirements (e.g., heavy on technical keywords vs.
   leadership/soft-skills focus, senior vs. entry-level, portfolio-heavy vs. corporate),
   suggest ONE resume layout style and explain in one sentence why it fits this specific
   role. Do not give generic advice like 'make it professional' — be specific about layout
   choice (e.g., skills-first vs. chronological ordering, single-column for ATS parsing,
   a dedicated projects-highlight section for portfolio-heavy roles).

OUTPUT FORMAT — CRITICAL:
Return ONLY valid JSON. No markdown code fences, no backticks, no preamble, no explanation
text before or after. The response must start with { and end with }.

Required JSON shape:
{
  "matchScore": <integer 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "roadmap": [
    "Actionable step 1 referencing a specific missing skill",
    "Actionable step 2 referencing a specific missing skill"
  ],
  "templateSuggestion": {
    "style": "<short name of recommended resume format>",
    "reason": "<one sentence explaining why this format suits the target role>"
  }
}

--- RESUME TEXT START ---
${resumeText.trim()}
--- RESUME TEXT END ---

--- JOB DESCRIPTION START ---
${jobDescription.trim()}
--- JOB DESCRIPTION END ---
`.trim();
}

function stripMarkdownFences(raw) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * Call Gemini and parse the JSON response.
 * Retries once on malformed JSON / schema errors only.
 * Quota (429) errors throw immediately — no point retrying, and there is
 * NO non-AI fallback: if Gemini is unavailable, the request fails honestly.
 */
async function callGeminiWithRetry(prompt) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const raw = result.response.text();
      console.log(raw);
      const cleaned = stripMarkdownFences(raw);
      const parsed = JSON.parse(cleaned);

      // Basic schema validation
      if (
        typeof parsed.matchScore !== "number" ||
        !Array.isArray(parsed.matchedSkills) ||
        !Array.isArray(parsed.missingSkills) ||
        !Array.isArray(parsed.roadmap)
      ) {
        throw new Error("Gemini response missing required fields");
      }

      // Feature 2: validate templateSuggestion
      if (
        !parsed.templateSuggestion ||
        typeof parsed.templateSuggestion.style !== "string" ||
        parsed.templateSuggestion.style.trim() === ""
      ) {
        throw new Error("Gemini response missing templateSuggestion.style");
      }

      return parsed;
    } catch (err) {
      // Quota / rate-limit errors: no point retrying, throw immediately
      if (isQuotaError(err)) throw err;

      console.warn(`⚠️  Gemini parse attempt ${attempt} failed:`, err.message);
      if (attempt === 2) throw err;
      // Brief pause before retry (only for JSON parse / schema errors)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

// ─── POST /api/analyze ────────────────────────────────────────────────────────
//
// requireAuth runs before multer — the JWT is in the Authorization header,
// so it doesn't need the body to be parsed yet.
//
router.post("/", requireAuth, (req, res, next) => {
  upload.single("resume")(req, res, async (multerErr) => {
    if (multerErr) {
      console.warn("Multer upload failed:", multerErr.message);
      return res.status(400).json({ error: multerErr.message });
    }

    try {
      const { jobDescription, jobTitle } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ error: "Resume file is required. Please upload a PDF or DOCX." });
      }
      if (!jobDescription || jobDescription.trim().length < 20) {
        return res
          .status(400)
          .json({ error: "Job description is required (at least 20 characters)." });
      }
      if (!jobTitle || jobTitle.trim().length === 0) {
        return res.status(400).json({ error: "Job title is required." });
      }

      let resumeText;
      try {
        resumeText = await parseResume(req.file.buffer, req.file.mimetype);
      } catch (parseErr) {
        console.error("Resume parsing error:", parseErr);
        return res.status(422).json({ error: parseErr.message });
      }

      if (!resumeText || resumeText.trim().length < 50) {
        return res.status(422).json({
          error: "Your resume appears to be empty or unreadable. Please upload a text-based PDF or DOCX.",
        });
      }

      // Truncate before sending to Gemini — prevents token-limit crashes on
      // very large resumes and limits prompt injection surface area.
      const truncatedResume =
        resumeText.trim().length > MAX_RESUME_CHARS
          ? resumeText.trim().slice(0, MAX_RESUME_CHARS) +
            "\n[Resume truncated for processing]"
          : resumeText.trim();

      // ── AI analysis — no heuristic/mock fallback. If Gemini fails or is
      // rate-limited, the request fails honestly with a clear message. ──
      let aiResult;
      try {
        const prompt = buildPrompt(truncatedResume, jobDescription);
        aiResult = await callGeminiWithRetry(prompt);
      } catch (aiErr) {
        console.error("Gemini analysis failed:", aiErr);
        const quotaHit = isQuotaError(aiErr);
        return res.status(quotaHit ? 503 : 500).json({
          error: quotaHit
            ? "AI analysis is temporarily rate-limited. Please wait a minute and try again."
            : "The AI couldn't analyze your resume right now. Please try again in a moment.",
        });
      }

      aiResult.matchScore = Math.min(100, Math.max(0, aiResult.matchScore));

      // Persist to DB — but don't let a transient connection error discard the AI result.
      // userId and userName come from the verified JWT (attached by requireAuth).
      let doc = null;
      try {
        doc = await Analysis.create({
          userId: req.userId,
          userName: req.userName,
          jobTitle: jobTitle.trim(),
          matchScore: aiResult.matchScore,
          matchedSkills: aiResult.matchedSkills,
          missingSkills: aiResult.missingSkills,
          roadmap: aiResult.roadmap,
          templateSuggestion: aiResult.templateSuggestion,
        });
      } catch (dbErr) {
        console.error("⚠️  DB write failed (analysis not saved):", dbErr.message);
        // Fall through — still return the AI result to the client
      }

      return res.status(201).json({
        _id: doc?._id ?? null,
        userName: req.userName,
        jobTitle: jobTitle.trim(),
        matchScore: aiResult.matchScore,
        matchedSkills: aiResult.matchedSkills,
        missingSkills: aiResult.missingSkills,
        roadmap: aiResult.roadmap,
        templateSuggestion: aiResult.templateSuggestion,
        createdAt: doc?.createdAt ?? new Date().toISOString(),
        savedToHistory: doc !== null,
      });
    } catch (err) {
      console.error("Unhandled analysis error:", err);
      next(err);
    }
  });
});

module.exports = router;