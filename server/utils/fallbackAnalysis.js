// ─── Curated tech-skill dictionary (used for priority phrase matching) ────────
const KNOWN_SKILLS = [
  // Languages
  "javascript", "typescript", "python", "java", "c++", "c#", "golang", "go",
  "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "perl",
  "dart", "lua", "haskell", "elixir", "bash", "shell scripting", "powershell",
  // Frontend
  "react", "vue", "angular", "svelte", "next.js", "nuxt.js", "gatsby",
  "html", "css", "sass", "less", "tailwind", "tailwindcss", "bootstrap",
  "jquery", "webpack", "vite", "babel", "redux", "mobx", "zustand",
  "graphql", "apollo", "storybook", "jest", "cypress", "playwright",
  "react native", "electron",
  // Backend
  "node.js", "express", "fastapi", "django", "flask", "spring boot",
  "asp.net", "laravel", "rails", "gin", "fiber", "fastify",
  "rest api", "restful", "grpc", "websockets", "socket.io",
  "microservices", "serverless", "oauth", "jwt",
  // Databases
  "mongodb", "postgresql", "mysql", "sqlite", "mssql", "oracle", "mariadb",
  "redis", "memcached", "elasticsearch", "cassandra", "dynamodb",
  "firebase", "supabase", "sql", "nosql", "prisma", "mongoose", "sequelize",
  "typeorm", "neo4j",
  // Cloud / Infra / DevOps
  "aws", "gcp", "azure", "heroku", "vercel", "netlify", "digitalocean",
  "docker", "kubernetes", "terraform", "ansible", "jenkins",
  "github actions", "gitlab ci", "circleci", "ci/cd", "ci cd",
  "nginx", "apache", "linux", "ubuntu",
  // AI / ML / Data
  "machine learning", "deep learning", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "matplotlib", "opencv",
  "nlp", "computer vision", "transformers", "langchain", "openai",
  "llm", "reinforcement learning", "data science", "jupyter", "spark",
  "hadoop", "airflow", "dbt",
  // Tools / Process
  "git", "github", "gitlab", "bitbucket", "jira", "confluence",
  "figma", "photoshop", "postman", "swagger", "datadog", "grafana",
  "prometheus", "sentry",
  "agile", "scrum", "kanban", "devops", "tdd", "bdd",
  "object oriented", "functional programming", "design patterns",
  "solid principles", "clean code",
].map((s) => s.toLowerCase());

// ─── Stop words to strip from generic n-gram extraction ──────────────────────
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","is","are","was","were","be","been",
  "being","have","has","had","do","does","did","will","would","could",
  "should","may","might","can","i","you","he","she","it","we","they",
  "me","him","her","us","them","my","your","his","its","our","their",
  "this","that","these","those","what","which","who","when","where",
  "how","all","both","each","more","most","other","some","no","not",
  "only","same","so","than","too","very","just","as","if","then",
  "also","well","must","etc","eg","ie","per","via","strong","good",
  "great","work","experience","years","year","minimum","least",
  "required","preferred","ability","knowledge","understanding",
  "familiar","proficiency","including","such","following","using",
  "used","use","new","key","role","team","based","related","across",
  "within","between","ensure","help","build","develop","create","design",
  "implement","maintain","manage","support","provide","own","make",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise to lowercase, collapse whitespace */
function normalise(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Extract word tokens from text */
function tokenize(text) {
  return normalise(text).split(/[^a-z0-9.#+]+/).filter(Boolean);
}

/**
 * Extract candidate skill phrases from text.
 * First tries the curated dictionary (phrase match), then falls back to
 * 1-3 word n-grams after stop-word filtering.
 */
function extractSkillPhrases(text) {
  const norm = normalise(text);
  const found = new Set();

  // 1. Dictionary phrases (highest quality)
  for (const skill of KNOWN_SKILLS) {
    // Use word-boundary-aware check: skill must appear as a whole word/phrase
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i").test(norm)) {
      found.add(skill);
    }
  }

  // 2. N-gram fallback for terms not in the dictionary
  const words = tokenize(text);
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(" ");
      // Skip if all words are stop words, or phrase is very short
      const phraseWords = phrase.split(" ");
      const meaningful = phraseWords.filter((w) => !STOP_WORDS.has(w) && w.length > 1);
      if (meaningful.length === 0) continue;
      if (phrase.length < 2) continue;
      // Don't add redundant sub-phrases if a longer one already matched
      if ([...found].some((f) => f.includes(phrase) && f !== phrase)) continue;
      if (!STOP_WORDS.has(phrase)) found.add(phrase);
    }
  }

  return [...found];
}

// ─── Public API ───────────────────────────────────────────────────────────────

function createFallbackAnalysis(resumeText, jobDescription) {
  const resumeNorm = normalise(resumeText);

  const jobPhrases = extractSkillPhrases(jobDescription);

  const matchedSkills = [];
  const missingSkills = [];

  for (const phrase of jobPhrases) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const inResume = new RegExp(
      `(?<![a-z0-9])${escaped}(?![a-z0-9])`,
      "i"
    ).test(resumeNorm);

    if (inResume) {
      matchedSkills.push(phrase);
    } else {
      missingSkills.push(phrase);
    }
  }

  // Prioritise known skills in the output lists
  const prioritise = (list) => {
    const known = list.filter((p) => KNOWN_SKILLS.includes(p));
    const other = list.filter((p) => !KNOWN_SKILLS.includes(p));
    return [...known, ...other];
  };

  const finalMatched = [...new Set(prioritise(matchedSkills))].slice(0, 10);
  const finalMissing = [...new Set(prioritise(missingSkills))].slice(0, 10);

  const score = Math.round(
    (finalMatched.length / Math.max(1, finalMatched.length + finalMissing.length)) * 100
  );

  const roadmap = finalMissing.slice(0, 5).map((skill) => {
    const cap = skill.charAt(0).toUpperCase() + skill.slice(1);
    return `Learn ${cap}: search for a hands-on tutorial or build a small project that specifically uses ${skill} to add it to your resume.`;
  });

  return {
    matchScore: Math.min(100, Math.max(0, score)),
    matchedSkills: finalMatched,
    missingSkills: finalMissing,
    roadmap,
  };
}

module.exports = { createFallbackAnalysis };
