const express = require("express");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const { generateToken } = require("../utils/auth");

const router = express.Router();

const SALT_ROUNDS = 10;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the safe user object returned in every auth response.
 * Never includes passwordHash or googleId.
 */
function safeUser(user) {
  return {
    userName: user.userName,
    collegeName: user.collegeName,
    authProvider: user.authProvider,
  };
}

/**
 * Check whether a userName or registerNumber is already taken.
 * Returns an error message string if taken, null if available.
 */
async function checkUniqueness(userName, registerNumber, excludeId = null) {
  const filter = excludeId ? { _id: { $ne: excludeId } } : {};

  const [existingName, existingReg] = await Promise.all([
    User.findOne({ userName, ...filter }).lean(),
    User.findOne({ registerNumber, ...filter }).lean(),
  ]);

  if (existingName) return "Username is already taken. Please choose another.";
  if (existingReg)
    return "Register number is already registered. Please check your details.";
  return null;
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { userName, registerNumber, collegeName, password, confirmPassword } =
      req.body;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!userName || !userName.trim()) {
      return res.status(400).json({ error: "Username is required." });
    }
    if (!registerNumber || !registerNumber.trim()) {
      return res.status(400).json({ error: "Register number is required." });
    }
    if (!collegeName || !collegeName.trim()) {
      return res.status(400).json({ error: "College name is required." });
    }
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // ── Uniqueness check ─────────────────────────────────────────────────────
    const conflictMsg = await checkUniqueness(
      userName.trim(),
      registerNumber.trim()
    );
    if (conflictMsg) {
      return res.status(409).json({ error: conflictMsg });
    }

    // ── Create user ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      userName: userName.trim(),
      registerNumber: registerNumber.trim(),
      collegeName: collegeName.trim(),
      passwordHash,
      authProvider: "local",
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res
      .status(500)
      .json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // ── Find user — deliberately vague on failure to avoid info leakage ──────
    const user = await User.findOne({ userName: userName.trim() });

    if (!user || user.authProvider !== "local") {
      return res
        .status(401)
        .json({ error: "Invalid username or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ error: "Invalid username or password." });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ error: "Login failed. Please try again." });
  }
});

// ─── POST /api/auth/google ────────────────────────────────────────────────────
//
// Verifies the Google ID token server-side.
// - Existing Google user  → issue JWT immediately.
// - New Google user       → return requiresProfileCompletion so the frontend
//                           can collect registerNumber + collegeName first.
//
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "Google ID token is required." });
    }

    // ── Verify token server-side ─────────────────────────────────────────────
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr.message);
      return res
        .status(401)
        .json({ error: "Google sign-in failed. Please try again." });
    }

    const { sub: googleId, email, name } = payload;

    // ── Returning Google user ────────────────────────────────────────────────
    const existingUser = await User.findOne({ googleId });
    if (existingUser) {
      const token = generateToken(existingUser);
      return res.json({ token, user: safeUser(existingUser) });
    }

    // ── New Google user — needs profile completion ───────────────────────────
    // Derive a suggested username from Google name or email prefix.
    const suggestedUserName = name
      ? name.replace(/\s+/g, "").toLowerCase().slice(0, 20)
      : (email || "").split("@")[0].slice(0, 20);

    return res.json({
      requiresProfileCompletion: true,
      googleId,
      suggestedUserName,
      email: email || "",
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res
      .status(500)
      .json({ error: "Google sign-in failed. Please try again." });
  }
});

// ─── POST /api/auth/google/complete-profile ───────────────────────────────────
//
// Called after Google sign-in when the user is new and needs to provide
// registerNumber + collegeName to complete their account creation.
//
router.post("/google/complete-profile", async (req, res) => {
  try {
    const { googleId, userName, registerNumber, collegeName } = req.body;

    if (!googleId || !userName || !registerNumber || !collegeName) {
      return res.status(400).json({
        error: "googleId, userName, registerNumber, and collegeName are all required.",
      });
    }

    // Ensure the googleId hasn't been registered in the meantime
    const alreadyExists = await User.findOne({ googleId });
    if (alreadyExists) {
      // Account was created concurrently — just log them in
      const token = generateToken(alreadyExists);
      return res.json({ token, user: safeUser(alreadyExists) });
    }

    // ── Uniqueness check ─────────────────────────────────────────────────────
    const conflictMsg = await checkUniqueness(
      userName.trim(),
      registerNumber.trim()
    );
    if (conflictMsg) {
      return res.status(409).json({ error: conflictMsg });
    }

    // ── Create Google user — no passwordHash ─────────────────────────────────
    const user = await User.create({
      userName: userName.trim(),
      registerNumber: registerNumber.trim(),
      collegeName: collegeName.trim(),
      googleId,
      authProvider: "google",
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error("Google complete-profile error:", err);
    return res
      .status(500)
      .json({ error: "Profile completion failed. Please try again." });
  }
});

module.exports = router;
