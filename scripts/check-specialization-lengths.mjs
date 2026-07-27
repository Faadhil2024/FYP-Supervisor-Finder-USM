// scripts/check-specialization-lengths.mjs -- diagnostic
// Same idea as the cluster-length check: a real specialization value
// is a short comma-separated list. Anything empty or wildly long/short
// is worth a look -- likely the same ALL-CAPS heading mismatch bug
// (scraper looks for "Specialization" exactly, misses "SPECIALIZATION").

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const rows = await sql`
  SELECT name, slug, specialization, LENGTH(specialization) as len
  FROM professors
  ORDER BY len ASC NULLS FIRST
`;

console.log(rows.map(r => `${(r.len ?? 0).toString().padStart(6)} chars -- ${r.name} (${r.slug}): ${JSON.stringify(r.specialization)}`).join("\n"));
await sql.end();
