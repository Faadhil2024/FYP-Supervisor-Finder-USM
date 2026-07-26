// scripts/debug-raw-projects.mjs -- temporary debug tool
// Re-fetches ONE professor's page and prints the raw, unparsed text
// found in their Projects section, so we can see the actual label
// wording/formatting before regex parsing touches it.

import * as cheerio from "cheerio";
import fs from "node:fs/promises";

const CONTENT_SELECTORS = [".uk-article", ".com-content-article__body", "#tm-main article", "article"];

function findContentContainer($) {
  for (const sel of CONTENT_SELECTORS) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) return el;
  }
  return null;
}

function normalizeHeading(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const SECTION_HEADERS = [
  "qualifications", "interests", "projects", "publications",
  "awards / recognitions", "awards", "recognitions", "supervision",
  "teaching", "leadership / membership", "consultancy",
];

function extractOrderedBlocks($, container) {
  const blocks = [];
  container.find("h1,h2,h3,h4,h5,p,li").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text) return;
    const isHeadingTag = /^h[1-5]$/i.test(el.tagName);
    const isBoldOnlyPara =
      !isHeadingTag &&
      $el.children("strong,b").length === 1 &&
      $el.children().first().text().trim() === text;
    const normalized = normalizeHeading(text);
    const looksLikeYear = /^\d{4}$/.test(text.trim());
    const looksLikeKnownHeader = SECTION_HEADERS.some((h) => normalized === h);
    if (isHeadingTag || isBoldOnlyPara) {
      if (looksLikeYear) blocks.push({ type: "year-heading", value: text.trim() });
      else if (looksLikeKnownHeader) blocks.push({ type: "section-heading", value: normalized });
      else blocks.push({ type: "text", value: text });
    } else {
      blocks.push({ type: "text", value: text });
    }
  });
  return blocks;
}

async function main() {
  const slug = process.argv[2];
  const lecturersFile = JSON.parse(await fs.readFile("docs/data-collection/lecturers.json", "utf-8"));
  const lecturers = lecturersFile.results ?? lecturersFile;

  // crude name match on slug fragments
  const lect = lecturers.find((l) =>
    l.name.toLowerCase().replace(/[^a-z]/g, "").includes(slug.replace(/-/g, ""))
  );
  if (!lect) {
    console.log("Could not find a lecturer matching:", slug);
    console.log("Try passing part of their name instead, e.g. 'amanjantan'");
    return;
  }

  console.log("Fetching:", lect.profileUrl);
  const res = await fetch(lect.profileUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const container = findContentContainer($);
  if (!container) {
    console.log("Content container not found!");
    return;
  }
  const blocks = extractOrderedBlocks($, container);

  const start = blocks.findIndex((b) => b.type === "section-heading" && b.value === "projects");
  if (start === -1) {
    console.log("No 'Projects' section-heading found at all.");
    console.log("All headings detected on this page:");
    console.log(blocks.filter((b) => b.type === "section-heading" || b.type === "year-heading"));
    return;
  }
  const end = blocks.findIndex((b, i) => i > start && b.type === "section-heading");
  const slice = blocks.slice(start + 1, end === -1 ? undefined : end);

  console.log("\n--- RAW TEXT BLOCKS IN PROJECTS SECTION ---\n");
  slice.forEach((b, i) => console.log(`[${i}] (${b.type}):`, b.value));
}

main();
