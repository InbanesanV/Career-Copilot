const dotenv = require("dotenv");
dotenv.config();

// ─── Startup env validation ───────────────────────────────────────────────────
const REQUIRED_ENV = [
  "MONGO_URI",
  "GEMINI_API_KEY",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
];
const missingVars = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(
    `\n❌  Missing required environment variables: ${missingVars.join(", ")}\n` +
      `   Please copy server/.env.example → server/.env and fill in the values.\n`
  );
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const analyzeRouter = require("./routes/analyze");
const historyRouter = require("./routes/history");
const authRouter = require("./routes/auth");

const app = express();
module.exports = app;
const PORT = process.env.PORT || 5000;

// ─── Rate Limiters ────────────────────────────────────────────────────────────

// Global limiter — all routes: 150 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a few minutes and try again." },
});

// Strict limiter — /api/analyze only: 10 requests per 15 minutes per IP
// Prevents Gemini quota burn and abuse.
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "You have submitted too many analyses. Please wait 15 minutes before trying again.",
  },
});

// Auth limiter — /api/auth: 20 requests per 15 minutes per IP
// Prevents brute-force attacks on login/register.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please wait a few minutes and try again." },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://career-copilot-brown.vercel.app",       // your stable production frontend domain
  "https://career-copilot-inbanesanvs-projects.vercel.app", // Vercel's project alias (backup)
  ...(process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",").map((s) => s.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow any localhost port during local development
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel preview deployment for this project
      // (matches career-copilot-<hash>-inbanesanvs-projects.vercel.app)
      if (/^https:\/\/career-copilot-[a-z0-9]+-inbanesanvs-projects\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`⚠️  CORS blocked request from origin: ${origin}`);
      callback(new Error("Not allowed by CORS policy"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/analyze", analyzeLimiter, analyzeRouter);
app.use("/api/history", historyRouter);

app.get("/", (_req, res) => res.send("Career Copilot API is running ✅"));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

// ─── MongoDB connection (with retry) ─────────────────────────────────────────
const MONGO_MAX_RETRIES = 5;
const MONGO_RETRY_BASE_MS = 2000; // doubles each attempt: 2s, 4s, 8s, 16s, 32s

async function connectWithRetry(attempt = 1) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅  Connected to MongoDB Atlas");
    app.listen(PORT, () =>
      console.log(`🚀  Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    // MongoDB's generic connection error always says "isn't whitelisted" as a
    // "common reason" — don't treat that as a definitive whitelist error.
    // Only flag it if the error specifically says the IP was rejected.
    const isWhitelistErr =
      /whitelist/i.test(err.message) &&
      !/one common reason/i.test(err.message); // filter out the generic hint

    const isPausedCluster = /cluster.*paused|serverSelectionTimed/i.test(
      err.message
    );
    console.error(
      `❌  MongoDB connection failed (attempt ${attempt}/${MONGO_MAX_RETRIES}):`,
      err.message
    );

    if (isWhitelistErr) {
      console.error(
        "\n🔒  Your IP is not whitelisted on MongoDB Atlas.\n" +
        "    Fix: Atlas → Network Access → Add IP Address (or 0.0.0.0/0 for dev)\n"
      );
    }

    if (isPausedCluster) {
      console.error(
        "\n😴  Your Atlas cluster may be paused (free tier pauses after inactivity).\n" +
        "    Fix: Go to Atlas → Clusters → click 'Resume' on your cluster.\n"
      );
    }

    if (!isWhitelistErr && !isPausedCluster) {
      console.error(
        "\n🔍  Possible causes: wrong password, wrong cluster URL, network firewall,\n" +
        "    or Atlas cluster is paused. Check your MONGO_URI in .env carefully.\n"
      );
    }

    if (attempt >= MONGO_MAX_RETRIES) {
      console.error("\n💀  Max retries reached. Exiting.\n");
      process.exit(1);
    }

    const delay = MONGO_RETRY_BASE_MS * Math.pow(2, attempt - 1);
    console.warn(`⏳  Retrying in ${delay / 1000}s...\n`);
    setTimeout(() => connectWithRetry(attempt + 1), delay);
  }
}

connectWithRetry();
