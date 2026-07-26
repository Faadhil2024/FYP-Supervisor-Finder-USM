// lib/synonyms.ts
//
// Shared synonym/topic map used by BOTH the main catalog search and the
// compare-page matchmaker, so "vision" behaves consistently everywhere
// instead of only working on one page. Hand-curated from real terms
// seen across the 42 professors' research interest/specialization text
// and publication topics -- not exhaustive, expand as gaps are found.

export const SYNONYMS: Record<string, string[]> = {
  vision: ["image processing", "computer vision", "facial recognition", "video tracking", "medical imaging", "object detection"],
  ai: ["artificial intelligence", "machine learning", "deep learning", "neural network"],
  ml: ["machine learning", "deep learning", "artificial intelligence"],
  security: ["cybersecurity", "network security", "intrusion detection", "malware", "forensic", "cryptography", "blockchain"],
  nlp: ["natural language processing", "text mining", "sentiment analysis", "language model"],
  data: ["data mining", "data analytics", "big data", "database"],
  network: ["networking", "network security", "wireless", "iot", "internet of things"],
  robot: ["robotics", "path planning", "autonomous"],
  cloud: ["cloud computing", "distributed systems", "grid computing"],
  web: ["web application", "web development", "software engineering"],
  blockchain: ["cryptocurrency", "distributed ledger", "smart contract"],
  health: ["healthcare", "medical", "biomedical", "clinical"],
  game: ["game development", "gamification", "virtual reality", "augmented reality"],
};

const STOPWORDS = new Set([
  "the", "and", "for", "with", "using", "based", "a", "an", "of", "in",
  "on", "to", "is", "are", "i", "want", "work", "research", "study",
  "studies", "interested", "interest", "my", "me", "about",
]);

export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export function expandQueryWords(words: string[]): string[] {
  const expanded = new Set(words);
  for (const w of words) {
    const synonyms = SYNONYMS[w];
    if (synonyms) synonyms.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

// True if `text` contains ANY of the expanded query terms (word or
// phrase). Used by the main catalog search for a simple yes/no filter,
// as opposed to the matchmaker's scored/ranked version.
export function matchesAnyTerm(text: string, expandedWords: string[]): boolean {
  const lower = text.toLowerCase();
  return expandedWords.some((w) => lower.includes(w));
}