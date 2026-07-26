// scripts/scrape-publications-projects.mjs
//
// Fetches each professor's USM profile page and extracts the raw
// "Projects" and "Publications" sections. Outputs a JSON file per
// professor's slug with everything found -- NO selection/filtering
// logic here, that's a separate step (select-best.mjs) so you can
// re-run selection without re-scraping.
//
// IMPORTANT: this assumes the same container selector your existing
// scrape-lecturers.mjs uses to grab the main profile content area.
// Adjust CONTENT_SELECTOR below to match if it doesn't find anything --
// check what selector scrape-lecturers.mjs uses for consistency.

import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";

const LECTURERS_JSON = "docs/data-collection/lecturers.json";
const OUTPUT_JSON = "docs/data-collection/publications-projects-raw.json";

// Slug generation MUST exactly mirror scripts/seed-professors.mjs, since
// that's the script that actually wrote the slugs into the DB. Same
// splitNameAndTitle + slugify + dedup-in-array-order logic, copied
// verbatim rather than re-derived, so results['some-slug'] matches a
// real professors.slug row.
function splitNameAndTitle(rawName) {
  if (!rawName) return { name: "Unknown", title: null };
  const [namePart, ...titleParts] = rawName.split(",");
  return {
    name: namePart.trim(),
    title: titleParts.length > 0 ? titleParts.join(",").trim() : null,
  };
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Adjust this if it doesn't match -- Joomla templates commonly use one
// of these for the main article body. Try in order until one works.
const CONTENT_SELECTORS = [
  ".uk-article",
  ".com-content-article__body",
  "#tm-main article",
  "article",
];

function findContentContainer($) {
  for (const sel of CONTENT_SELECTORS) {
    const el = $(sel);
    if (el.length && el.text().trim().length > 200) return el;
  }
  return null;
}

// Headings we care about, matched case-insensitively against trimmed text
const SECTION_HEADERS = [
  "qualifications",
  "interests",
  "projects",
  "publications",
  "awards / recognitions",
  "awards",
  "recognitions",
  "supervision",
  "teaching",
  "leadership / membership",
  "consultancy",
];

function normalizeHeading(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// Walk the content container's children in document order, building a
// flat list of {type: 'heading'|'text', value} so we don't depend on
// exact tag nesting (h3 vs h4 vs strong-wrapped-in-p, which varies a lot
// across these Joomla-authored pages per your own scraper notes).
function extractOrderedBlocks($, container) {
  const blocks = [];
  container.find("h1,h2,h3,h4,h5,p,li").each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text) return;

    const isHeadingTag = /^h[1-5]$/i.test(el.tagName);
    // Also treat a <p><strong>SomeHeading</strong></p> as a heading if
    // the whole paragraph is just bold text matching a known header --
    // Joomla editors do this constantly instead of real heading tags.
    const isBoldOnlyPara =
      !isHeadingTag &&
      $el.children("strong,b").length === 1 &&
      $el.children().first().text().trim() === text;

    const normalized = normalizeHeading(text);
    const looksLikeYear = /^\d{4}$/.test(text.trim());
    const looksLikeKnownHeader = SECTION_HEADERS.some((h) => normalized === h);

    if (isHeadingTag || isBoldOnlyPara) {
      if (looksLikeYear) {
        blocks.push({ type: "year-heading", value: text.trim() });
      } else if (looksLikeKnownHeader) {
        blocks.push({ type: "section-heading", value: normalized });
      } else {
        blocks.push({ type: "text", value: text });
      }
    } else {
      blocks.push({ type: "text", value: text });
    }
  });
  return blocks;
}

function extractProjectsSection(blocks) {
  const start = blocks.findIndex(
    (b) => b.type === "section-heading" && b.value === "projects"
  );
  if (start === -1) return { raw: [], isEmpty: true };

  const end = blocks.findIndex(
    (b, i) => i > start && b.type === "section-heading"
  );
  const slice = blocks.slice(start + 1, end === -1 ? undefined : end);
  const textLines = slice.filter((b) => b.type === "text").map((b) => b.value);

  const isEmpty =
    textLines.length === 0 ||
    textLines.every((t) => /\[Fill your .*\]/i.test(t));
  // Note: parseProjectBlocks() does its own placeholder filtering on top
  // of this -- a page can have isEmpty=false here (because it has real
  // lines alongside the placeholder) while still ending up with real
  // parsed projects once the placeholder noise is stripped out there.

  return { raw: textLines, isEmpty };
}

function extractPublicationsSection(blocks) {
  const start = blocks.findIndex(
    (b) => b.type === "section-heading" && b.value === "publications"
  );
  if (start === -1) return { byYear: {}, isEmpty: true };

  const end = blocks.findIndex(
    (b, i) => i > start && b.type === "section-heading"
  );
  const slice = blocks.slice(start + 1, end === -1 ? undefined : end);

  const byYear = {};
  let currentYear = null;
  for (const b of slice) {
    if (b.type === "year-heading") {
      currentYear = parseInt(b.value, 10);
      byYear[currentYear] = byYear[currentYear] || [];
    } else if (b.type === "text" && currentYear) {
      // Filter out stray metadata lines like "Researcher ID : ..." that
      // sometimes sit right under the Publications heading before any
      // year appears -- those get skipped since currentYear is null then.
      byYear[currentYear].push(b.value);
    }
  }

  const isEmpty = Object.keys(byYear).length === 0;
  return { byYear, isEmpty };
}

// Parses a project text block like:
// "Grant Name: USM Short Term Grant (STG-2) (Completed)
//  Grant Amount: RM35,000
//  Role: Project Leader
//  Project Title: New Coefficient of Variation...
//  1/6/2022 - 31/5/2024"
// These often collapse into ONE text node per field because cheerio's
// .text() on a <p> with <br> separators returns them concatenated --
// so also try splitting on the field labels directly.
function parseProjectBlocks(rawLines) {
  // Strip placeholder noise like "[Fill your grants or other projects]"
  // that USM's template inserts even on pages that also have real
  // project titles listed right after it (e.g. Aman Jantan's page).
  const meaningfulLines = rawLines.filter((l) => !/\[Fill your .*\]/i.test(l.trim()));
  if (meaningfulLines.length === 0) return [];

  const joined = meaningfulLines.join("\n");
  const hasStructuredFields = /Grant Name\s*:/i.test(joined);

  if (hasStructuredFields) {
    // Structured format (e.g. Chew XinYing's page): "Grant Name: X Grant
    // Amount: Y Role: Z Project Title: W date-date", all mashed into one
    // line per project with no separators, split on "Grant Name:".
    const chunks = joined.split(/(?=Grant Name\s*:)/i).filter((c) => c.trim());
    const LABELS = ["Grant Name", "Grant Amount", "Role", "Project Title"];
    const labelAlternation = LABELS.join("|");

    function extractField(chunk, label) {
      const re = new RegExp(
        `${label}\\s*:\\s*([\\s\\S]+?)(?=(?:${labelAlternation})\\s*:|$)`,
        "i"
      );
      const m = chunk.match(re);
      return m ? m[1].trim() : null;
    }

    return chunks
      .map((chunk) => {
        const grantName = extractField(chunk, "Grant Name");
        const grantAmount = extractField(chunk, "Grant Amount");
        const role = extractField(chunk, "Role");
        let title = extractField(chunk, "Project Title");

        let dateRange = null;
        const dateMatch = title?.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4})\s*$/);
        if (dateMatch) {
          dateRange = dateMatch[1];
          title = title.slice(0, dateMatch.index).trim();
        }

        return { grantName, grantAmount, role, title, dateRange, rawChunk: chunk.trim() };
      })
      .filter((p) => p.title);
  }

  // Plain format (e.g. Aman Jantan's page): no field labels at all,
  // just one project title per line. No grant/role/date metadata exists
  // to extract, so those stay null -- select-best.mjs's scoring just
  // falls back to original list order for these.
  return meaningfulLines
    .map((line) => ({
      grantName: null,
      grantAmount: null,
      role: null,
      title: line.trim(),
      dateRange: null,
      rawChunk: line.trim(),
    }))
    .filter((p) => p.title);
}

async function scrapeProfessor(profileUrl) {
  const res = await fetch(profileUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (FYP-Supervisor-Finder-USM scraper)" },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${profileUrl}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const container = findContentContainer($);
  if (!container) {
    return { error: "content container not found, check CONTENT_SELECTORS" };
  }

  const blocks = extractOrderedBlocks($, container);
  const projectsSection = extractProjectsSection(blocks);
  const publicationsSection = extractPublicationsSection(blocks);

  return {
    projects: projectsSection.isEmpty ? [] : parseProjectBlocks(projectsSection.raw),
    projectsEmpty: projectsSection.isEmpty,
    publicationsByYear: publicationsSection.byYear,
    publicationsEmpty: publicationsSection.isEmpty,
  };
}

async function main() {
  const lecturersRaw = await fs.readFile(LECTURERS_JSON, "utf-8");
  const lecturersFile = JSON.parse(lecturersRaw);
  const lecturers = lecturersFile.results ?? lecturersFile; // handle {results, errors} shape

  const results = {};
  const seenSlugs = new Set(); // must dedup in the same array order as seed-professors.mjs
  for (const [i, lect] of lecturers.entries()) {
    if (!lect.profileUrl) {
      console.warn(`[skip] ${lect.name} has no profileUrl`);
      continue;
    }

    const { name } = splitNameAndTitle(lect.name);
    let slug = slugify(name);
    let suffix = 2;
    while (seenSlugs.has(slug)) {
      slug = `${slugify(name)}-${suffix}`;
      suffix++;
    }
    seenSlugs.add(slug);

    console.log(`[${i + 1}/${lecturers.length}] scraping ${lect.name} (slug: ${slug})...`);
    try {
      const data = await scrapeProfessor(lect.profileUrl);
      results[slug] = data;
    } catch (err) {
      console.error(`[error] ${lect.name}: ${err.message}`);
      results[slug] = { error: err.message };
    }
    // Be polite -- don't hammer USM's server across 42 requests
    await new Promise((r) => setTimeout(r, 500));
  }

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(results, null, 2));
  console.log(`\nDone. Wrote ${OUTPUT_JSON}`);
}

main();
