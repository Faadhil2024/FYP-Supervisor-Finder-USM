// scripts/suggest-tags.mjs
//
// Reads docs/data-collection/lecturers.json and suggests SE / IC / CI
// tags per professor based on keyword matches in their specialization
// and research interest text. This is a FIRST PASS ONLY -- USM doesn't
// publish an official professor-to-programme mapping, so these
// suggestions must be manually reviewed and corrected before use.
//
// Usage: node scripts/suggest-tags.mjs
// Output: docs/data-collection/tag-suggestions.json (for manual review)

import fs from "node:fs/promises";
import path from "node:path";

const LECTURERS_JSON_PATH = path.join("docs", "data-collection", "lecturers.json");
const OUTPUT_PATH = path.join("docs", "data-collection", "tag-suggestions.json");

const KEYWORDS = {
  SE: [
    "software engineering", "software quality", "software testing",
    "requirements engineering", "software process", "software design",
    "enterprise computing", "service computing", "software architecture",
  ],
  IC: [
    "artificial intelligence", "machine learning", "deep learning",
    "computational intelligence", "computer vision", "image processing",
    "natural language", "nlp", "knowledge engineering", "data mining",
    "data science", "neural network", "fuzzy", "evolutionary computing",
  ],
  CI: [
    "network", "cybersecurity", "cyber security", "security",
    "infrastructure", "cloud computing", "distributed systems",
    "internet of things", " iot", "blockchain", "cryptography", "forensic",
  ],
};

function suggestTags(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched = [];
  for (const [tag, keywords] of Object.entries(KEYWORDS)) {
    const hits = keywords.filter((kw) => lower.includes(kw));
    if (hits.length > 0) {
      matched.push({ tag, matchedKeywords: hits });
    }
  }
  return matched;
}

async function main() {
  const raw = await fs.readFile(LECTURERS_JSON_PATH, "utf-8");
  const { results } = JSON.parse(raw);

  const suggestions = results.map((r) => {
    const combinedText = [r.specialization, r.researchInterest].filter(Boolean).join(" ");
    const matches = suggestTags(combinedText);
    return {
      name: r.name,
      profileUrl: r.profileUrl,
      currentResearchCluster: r.researchCluster,
      suggestedTags: matches.map((m) => m.tag),
      matchDetails: matches,
      needsManualReview: matches.length === 0, // no keyword hit at all -- needs a human to read and decide
    };
  });

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(suggestions, null, 2));

  const noMatches = suggestions.filter((s) => s.needsManualReview).length;
  const multiTag = suggestions.filter((s) => s.suggestedTags.length > 1).length;
  console.log(`Wrote ${suggestions.length} suggestions to ${OUTPUT_PATH}`);
  console.log(`${noMatches} professors had NO keyword match -- these need you to read their profile and tag manually.`);
  console.log(`${multiTag} professors matched more than one category (multi-tag) -- verify these look right.`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
