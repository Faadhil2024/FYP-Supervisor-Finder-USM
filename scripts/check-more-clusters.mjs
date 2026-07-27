// scripts/check-more-clusters.mjs -- inspect the 3 newly-flagged suspects
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const rows = await sql`
  SELECT name, slug, research_cluster
  FROM professors
  WHERE slug IN ('mohd-halim-mohd-noor', 'nurul-hashimah-ahamed-hassain-malim', 'suzi-iryanti-fadilah', 'azman-ab-malik', 'hazrina-binti-yusof-hamdani')
`;

console.log(JSON.stringify(rows, null, 2));
await sql.end();
