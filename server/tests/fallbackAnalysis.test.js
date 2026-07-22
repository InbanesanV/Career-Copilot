const test = require("node:test");
const assert = require("node:assert/strict");

const { createFallbackAnalysis } = require("../utils/fallbackAnalysis");

test("creates a structured fallback analysis from resume and job text", () => {
  const result = createFallbackAnalysis(
    "I built React applications and Node.js APIs for SaaS products.",
    "We need a frontend engineer with React, Node.js, and PostgreSQL experience."
  );

  assert.ok(result.matchScore >= 0 && result.matchScore <= 100);
  assert.ok(result.matchedSkills.includes("react"));
  assert.ok(result.matchedSkills.includes("node.js"));
  assert.ok(result.missingSkills.includes("postgresql"));
  assert.ok(result.roadmap.length >= 2);
});
