// A real cluster name is short (e.g. "Data To Knowledge", ~20 chars).
// Anything wildly longer than that is almost certainly this same
// overflow bug on a professor we haven't spotted yet.

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const rows = await sql`
  SELECT name, slug, LENGTH(research_cluster) as len
  FROM professors
  WHERE research_cluster IS NOT NULL
  ORDER BY len DESC
`;

console.log(rows.map(r => `${r.len.toString().padStart(6)} chars -- ${r.name} (${r.slug})`).join("\n"));
await sql.end();
