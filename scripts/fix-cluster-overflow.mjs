// scripts/fix-cluster-overflow.mjs
//
// Fixes a scraper boundary bug affecting research_cluster: for these 4
// professors, the field captured EVERYTHING from the "Research Cluster"
// heading through to the end of the page (Specialization, Qualifications,
// Projects, Publications, Supervision, Teaching, footer text -- all of
// it), instead of stopping at the next heading. Same category of bug as
// the documented specialization-overflow issue, just never got the same
// stop-label fix applied to this field.
//
// Correct values extracted from the first line of each garbled blob,
// normalized so all "Enabling Technologies" variants match exactly for
// consistent grouping/filtering.

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const FIXES = [
  { slug: "chong-yung-wey", cluster: "Enabling Technologies And Infrastructures" },
  { slug: "mohd-adib-haji-omar", cluster: "Enabling Technologies And Infrastructures" },
  { slug: "mohd-najwadi-yusoff", cluster: "Enabling Technologies And Infrastructures" },
  { slug: "ramona-ramli", cluster: "Computational Intelligence" },
];

async function main() {
  for (const fix of FIXES) {
    const result = await sql`
      UPDATE professors
      SET research_cluster = ${fix.cluster}
      WHERE slug = ${fix.slug}
      RETURNING id, name, research_cluster
    `;
    if (result.length === 0) {
      console.log(`[not found] ${fix.slug}`);
    } else {
      console.log(`[fixed] ${result[0].name} -> "${result[0].research_cluster}"`);
    }
  }
  await sql.end();
}

main();
