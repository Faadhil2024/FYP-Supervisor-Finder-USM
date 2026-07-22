// scripts/seed-professors.mjs
//
// Reads docs/data-collection/lecturers.json (Milestone 2 output) and
// inserts it into the professors table (Milestone 3 schema).
//
// Uses raw SQL via the `postgres` client directly, rather than importing
// lib/db/schema.ts -- Node can't import a .ts file from a plain .mjs
// script without an extra TypeScript loader, so this keeps the script
// dependency-free and simple to run.
//
// Usage: node scripts/seed-professors.mjs

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const LECTURERS_JSON_PATH = path.join("docs", "data-collection", "lecturers.json");

// The scraped "name" field is a combined string like
// "Aman Jantan, Associate Professor Dr." -- split it into
// a clean display name and a title.
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
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }

  const raw = await fs.readFile(LECTURERS_JSON_PATH, "utf-8");
  const { results } = JSON.parse(raw);

  const sql = postgres(process.env.DATABASE_URL);

  console.log(`Seeding ${results.length} professors...`);

  const seenSlugs = new Set();
  const rows = results.map((r) => {
    const { name, title } = splitNameAndTitle(r.name);
    let slug = slugify(name);

    let suffix = 2;
    while (seenSlugs.has(slug)) {
      slug = `${slugify(name)}-${suffix}`;
      suffix++;
    }
    seenSlugs.add(slug);

    // Keys match the actual snake_case DB column names.
    return {
      name,
      title,
      slug,
      email: r.email,
      email_needs_manual_check: !!r.emailNeedsManualCheck,
      tel: r.tel,
      fax: r.fax,
      room: r.room,
      research_cluster: r.researchCluster,
      research_interest: r.researchInterest,
      specialization: r.specialization,
      profile_url: r.profileUrl,
    };
  });

  // Wipe and re-insert -- simpler for a one-off dataset refreshed wholesale.
  await sql`delete from professors`;

  await sql`
    insert into professors ${sql(
      rows,
      "name",
      "title",
      "slug",
      "email",
      "email_needs_manual_check",
      "tel",
      "fax",
      "room",
      "research_cluster",
      "research_interest",
      "specialization",
      "profile_url"
    )}
  `;

  console.log(`Done. Inserted ${rows.length} professors.`);
  await sql.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
