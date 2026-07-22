const express = require("express");
const mongoose = require("mongoose");

const Analysis = require("../models/Analysis");
const { requireAuth } = require("../utils/auth");

const router = express.Router();

// All history routes require a valid JWT — requireAuth attaches req.userId.
router.use(requireAuth);

// ─── GET /api/history/compare ─────────────────────────────────────────────────
//
// IMPORTANT: registered BEFORE the bare GET / handler so Express routes it
// correctly (otherwise "compare" would be interpreted as a route parameter).
//
// Query params: fromId, toId
//
router.get("/compare", async (req, res) => {
  try {
    const { fromId, toId } = req.query;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!fromId || !toId) {
      return res
        .status(400)
        .json({ error: "Both fromId and toId are required." });
    }

    // Validate ObjectId format before querying — avoids a Mongoose CastError
    if (
      !mongoose.Types.ObjectId.isValid(fromId) ||
      !mongoose.Types.ObjectId.isValid(toId)
    ) {
      return res
        .status(400)
        .json({ error: "fromId and toId must be valid analysis IDs." });
    }

    // ── Fetch both documents scoped to the authenticated user ─────────────────
    const [from, to] = await Promise.all([
      Analysis.findOne({ _id: fromId, userId: req.userId })
        .select("jobTitle matchScore matchedSkills missingSkills createdAt")
        .lean(),
      Analysis.findOne({ _id: toId, userId: req.userId })
        .select("jobTitle matchScore matchedSkills missingSkills createdAt")
        .lean(),
    ]);

    if (!from || !to) {
      return res
        .status(404)
        .json({ error: "One or both analyses not found." });
    }

    // ── Gap computation (case-insensitive) ────────────────────────────────────
    const fromMissingLower = (from.missingSkills || []).map((s) =>
      s.toLowerCase()
    );
    const toMatchedLower = (to.matchedSkills || []).map((s) =>
      s.toLowerCase()
    );
    const toMissingLower = (to.missingSkills || []).map((s) =>
      s.toLowerCase()
    );

    // Skills the candidate previously lacked but now demonstrates
    const closedGaps = (from.missingSkills || []).filter((skill) =>
      toMatchedLower.includes(skill.toLowerCase())
    );

    // Skills still missing in both analyses (persistent blockers)
    const persistentGaps = (to.missingSkills || []).filter((skill) =>
      fromMissingLower.includes(skill.toLowerCase())
    );

    // Skills missing in the newer analysis that were NOT missing before
    // (likely because they compared against a different / harder JD)
    const newGaps = (to.missingSkills || []).filter(
      (skill) => !fromMissingLower.includes(skill.toLowerCase())
    );

    return res.json({
      from: {
        jobTitle: from.jobTitle,
        matchScore: from.matchScore,
        createdAt: from.createdAt,
      },
      to: {
        jobTitle: to.jobTitle,
        matchScore: to.matchScore,
        createdAt: to.createdAt,
      },
      scoreDelta: to.matchScore - from.matchScore,
      closedGaps,
      persistentGaps,
      newGaps,
    });
  } catch (err) {
    console.error("Compare endpoint error:", err);
    return res
      .status(500)
      .json({ error: "Could not compare analyses. Please try again." });
  }
});

// ─── GET /api/history ─────────────────────────────────────────────────────────
//
// Returns all analyses for the authenticated user, sorted newest-first.
// No URL parameters — the user is identified entirely from the JWT.
//
router.get("/", async (req, res, next) => {
  try {
    const analyses = await Analysis.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("-userId") // no need to expose the internal FK to the client
      .lean();

    return res.json(analyses);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
