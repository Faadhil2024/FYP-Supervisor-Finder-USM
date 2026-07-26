// scripts/scrape-lecturers.mjs
//
// One-off data collection script for FYP Milestone 2/3.
// Fetches the USM School of Computer Sciences academic staff directory,
// then visits each individual profile page and extracts directory fields
// including a best-guess profile photo URL.
//
// Usage: node scripts/scrape-lecturers.mjs
// Output: docs/data-collection/lecturers.json

import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

const STAFF_LIST_URL = "https://cs.usm.my/index.php/about/our-people/academic-staff";
const OUTPUT_PATH = path.join("docs", "data-collection", "lecturers.json");
const REQUEST_DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "FYP-Supervisor-Finder-USM data collection (student project, USM)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function getProfileLinks() {
  const html = await fetchHtml(STAFF_LIST_URL);
  const $ = cheerio.load(html);

  const links = new Set();
  $("a[href*='faculty-member/']").each((_, el) => {
    const href = $(el).attr("href");
    if (href && href.includes("faculty-member/")) {
      const absolute = href.startsWith("http") ? href : `https://cs.usm.my${href}`;
      links.add(absolute);
    }
  });

  return Array.from(links);
}

// Known site-chrome images to exclude -- logo, admin icon, template assets.
// Anything matching these patterns is definitely NOT a staff photo.
const EXCLUDED_IMAGE_PATTERNS = [
  /templates\/yootheme/i,
  /icon_admin/i,
  /usm-white/i,
  /\/logo/i,
];

function findPhotoUrl($, baseUrl) {
  const candidates = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (!src) return;
    if (EXCLUDED_IMAGE_PATTERNS.some((pattern) => pattern.test(src))) return;
    const absolute = src.startsWith("http") ? src : new URL(src, baseUrl).toString();
    candidates.push(absolute);
  });

  if (candidates.length === 0) {
    return { photoUrl: null, photoNeedsManualCheck: true };
  }
  // Heuristic only -- we don't know USM's exact template structure for the
  // staff photo container, so we take the first non-chrome image and flag
  // it for a manual spot-check rather than asserting confidence we don't have.
  return { photoUrl: candidates[0], photoNeedsManualCheck: candidates.length > 1 };
}

function parseProfile(html, url) {
  const $ = cheerio.load(html);

  const rawAuthor = $('meta[name="author"]').attr("content")?.trim() || null;
  const looksLikeEmail = !!rawAuthor && /^\S+@\S+\.\S+$/.test(rawAuthor);
  const email = looksLikeEmail ? rawAuthor : null;

  const title = $("title").text().trim() || null;
  const { photoUrl, photoNeedsManualCheck } = findPhotoUrl($, url);

  const bodyText = $("body").text();

  function getTextBetween(startLabel, endLabels) {
    const startIndex = bodyText.indexOf(startLabel);
    if (startIndex === -1) return null;
    const afterStart = bodyText.slice(startIndex + startLabel.length);

    let endIndex = afterStart.length;
    for (const label of endLabels) {
      const idx = afterStart.indexOf(label);
      if (idx !== -1 && idx < endIndex) endIndex = idx;
    }
    const value = afterStart.slice(0, endIndex).trim();
    return value.length > 0 ? value : null;
  }

  // Added "Publications" as a stop boundary -- this is the fix for the
  // Ramona Ramli bug, where Specialization ran into the entire rest of
  // the page because no earlier boundary label was present.
  const researchCluster = getTextBetween("Research Cluster", ["Research Interest"]);
  const researchInterest = getTextBetween("Research Interest", ["Specialization"]);
  const specialization = getTextBetween("Specialization", [
    "Qualifications",
    "Interests",
    "Projects",
    "Publications",
    "Teaching",
  ]);

  const telMatch = bodyText.match(/Tel\s*:\s*([+\d][\d\s\-/]*\d)(?=\s*Fax|\s*Room|$)/);
  const faxMatch = bodyText.match(/Fax\s*:\s*([+\d][\d\s\-/]*\d)(?=\s*Room|$)/);
  const roomMatch = bodyText.match(/Room\s*:\s*([\d*]+)/);

  return {
    profileUrl: url,
    name: title,
    email,
    emailNeedsManualCheck: !looksLikeEmail,
    photoUrl,
    photoNeedsManualCheck,
    tel: telMatch ? telMatch[1].trim() : null,
    fax: faxMatch ? faxMatch[1].trim() : null,
    room: roomMatch ? roomMatch[1].trim() : null,
    researchCluster,
    researchInterest,
    specialization,
  };
}

async function main() {
  console.log("Fetching staff directory list...");
  const profileLinks = await getProfileLinks();
  console.log(`Found ${profileLinks.length} profile links.`);

  const results = [];
  const errors = [];

  for (const [index, url] of profileLinks.entries()) {
    try {
      console.log(`(${index + 1}/${profileLinks.length}) Fetching ${url}`);
      const html = await fetchHtml(url);
      const profile = parseProfile(html, url);
      results.push(profile);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
      errors.push({ url, error: err.message });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify({ results, errors }, null, 2));

  const needsManualEmail = results.filter((r) => r.emailNeedsManualCheck).length;
  const needsManualPhoto = results.filter((r) => r.photoNeedsManualCheck).length;
  console.log(`\nDone. ${results.length} profiles saved to ${OUTPUT_PATH}`);
  if (errors.length > 0) console.log(`${errors.length} profiles failed to fetch.`);
  if (needsManualEmail > 0) console.log(`${needsManualEmail} profiles need manual email lookup.`);
  if (needsManualPhoto > 0) console.log(`${needsManualPhoto} profiles need manual photo spot-check (ambiguous or multiple image candidates).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
