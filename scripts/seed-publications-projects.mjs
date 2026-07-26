// scripts/seed-publications-projects.mjs
//
// Loads docs/data-collection/publications-projects-selected.json into
// professor_publications and professor_projects tables.
//
// Uses raw postgres (same pattern as your other seed scripts, since
// Node can't import schema.ts directly from a .mjs file per your notes).

import postgres from "postgres";
import fs from "node:fs/promises";
import "dotenv/config";

const SELECTED_JSON = "docs/data-collection/publications-projects-selected.json";

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
  const selected = JSON.parse(await fs.readFile(SELECTED_JSON, "utf-8"));

  let pubCount = 0;
  let projCount = 0;

  for (const [slug, data] of Object.entries(selected)) {
    if (data.error) {
      console.warn(`[skip] ${slug}: ${data.error}`);
      continue;
    }

    const [prof] = await sql`SELECT id FROM professors WHERE slug = ${slug}`;
    if (!prof) {
      console.warn(`[skip] no professor found for slug ${slug}`);
      continue;
    }

    // Clear existing rows for this professor so re-running is idempotent
    await sql`DELETE FROM professor_publications WHERE professor_id = ${prof.id}`;
    await sql`DELETE FROM professor_projects WHERE professor_id = ${prof.id}`;

    for (const pub of data.publications || []) {
      await sql`
        INSERT INTO professor_publications (professor_id, year, citation, is_selected)
        VALUES (${prof.id}, ${pub.year}, ${pub.citation}, true)
      `;
      pubCount++;
    }

    for (const proj of data.projects || []) {
      await sql`
        INSERT INTO professor_projects
          (professor_id, grant_name, grant_amount, role, title, date_range, is_selected)
        VALUES (
          ${prof.id}, ${proj.grantName}, ${proj.grantAmount},
          ${proj.role}, ${proj.title}, ${proj.dateRange}, true
        )
      `;
      projCount++;
    }
  }

  console.log(`Seeded ${pubCount} publications and ${projCount} projects.`);
  await sql.end();
}

main();
