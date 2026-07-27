// scripts/check-clusters.mjs -- temporary inspection script
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const rows = await sql`
  SELECT name, slug, research_cluster
  FROM professors
  WHERE slug IN ('chong-yung-wey', 'mohd-adib-haji-omar', 'mohd-najwadi-yusoff', 'ramona-ramli')
`;

console.log(JSON.stringify(rows, null, 2));
await sql.end();
