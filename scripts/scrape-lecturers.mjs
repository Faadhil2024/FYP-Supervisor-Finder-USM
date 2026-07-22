// scripts/scrape-lecturers.mjs
//
// One-off data collection script for FYP Milestone 2.
// Fetches the USM School of Computer Sciences academic staff directory,
// then visits each individual profile page and extracts directory fields.
//
// Usage: node scripts/scrape-lecturers.mjs
// Output: docs/data-collection/lecturers.json

import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

const STAFF_LIST_URL = "https://cs.usm.my/index.php/about/our-people/academic-staff";
const OUTPUT_PATH = path.join("docs", "data-collection", "lecturers.json");
const REQUEST_DELAY_MS = 500; // be polite to USM's server

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

function parseProfile(html, url) {
  const $ = cheerio.load(html);

  // The real email hides in the page's meta author tag, even though the
  // visible text is spam-obfuscated. BUT: some staff profiles have this
  // field misconfigured (contains their name instead of an email address).
  // That's a source-data problem, not something regex can paper over --
  // we validate the shape and null it out (flagged for manual lookup)
  // rather than saving garbage as if it were a real email.
  const rawAuthor = $('meta[name="author"]').attr("content")?.trim() || null;
  const looksLikeEmail = !!rawAuthor && /^\S+@\S+\.\S+$/.test(rawAuthor);
  const email = looksLikeEmail ? rawAuthor : null;

  const title = $("title").text().trim() || null;

  // The page's flattened text has no separators between elements (e.g. a
  // room number is immediately followed by "School of Computer Sciences..."
  // with no space). Rather than depend on a consistent DOM shape across all
  // 41 profiles (which we already found isn't consistent), we extract each
  // field as the text found BETWEEN one section label and the next.
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

  const researchCluster = getTextBetween("Research Cluster", ["Research Interest"]);
  const researchInterest = getTextBetween("Research Interest", ["Specialization"]);
  const specialization = getTextBetween("Specialization", ["Qualifications", "Interests", "Projects"]);

  // Tel / Fax / Room: capture only plausible characters (digits, +, spaces,
  // dashes, slashes, or "*" placeholders USM sometimes uses for unlisted
  // rooms), stopping right before the next known label instead of greedily
  // eating into it.
  const telMatch = bodyText.match(/Tel\s*:\s*([+\d][\d\s\-/]*\d)(?=\s*Fax|\s*Room|$)/);
  const faxMatch = bodyText.match(/Fax\s*:\s*([+\d][\d\s\-/]*\d)(?=\s*Room|$)/);
  const roomMatch = bodyText.match(/Room\s*:\s*([\d*]+)/);

  return {
    profileUrl: url,
    name: title,
    email,
    emailNeedsManualCheck: !looksLikeEmail,
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
  console.log(`\nDone. ${results.length} profiles saved to ${OUTPUT_PATH}`);
  if (errors.length > 0) {
    console.log(`${errors.length} profiles failed to fetch — check the "errors" array.`);
  }
  if (needsManualEmail > 0) {
    console.log(`${needsManualEmail} profiles have an unverifiable email (flagged emailNeedsManualCheck: true) — look these up manually.`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
