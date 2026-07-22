const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    // Owner of this analysis — set from the authenticated user's JWT.
    // Used for all access-control queries; userName is display-only.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    // Kept for display in history cards, results page, etc.
    // Populated from req.userName (JWT payload) at analysis time.
    userName: {
      type: String,
      required: [true, "userName is required"],
      trim: true,
    },
    jobTitle: {
      type: String,
      required: [true, "jobTitle is required"],
      trim: true,
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    roadmap: {
      type: [String],
      default: [],
    },
    // AI-generated resume format recommendation (Feature 2).
    // Optional — not present on documents created before this field was added.
    templateSuggestion: {
      style: { type: String },
      reason: { type: String },
    },
  },
  { timestamps: true } // auto-manages createdAt + updatedAt
);

// Fast history list: all analyses for a user, newest first
analysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);
