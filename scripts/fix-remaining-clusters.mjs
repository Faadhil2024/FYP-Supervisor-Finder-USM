// scripts/fix-remaining-clusters.mjs
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const FIXES = [
  { slug: "mohd-halim-mohd-noor", cluster: "Data To Knowledge" },
  {
    slug: "nurul-hashimah-ahamed-hassain-malim",
    cluster: "Data to Knowledge Cluster (PPSKOMP), Brain and Behavior Cluster (USM), Big Data Analytics Cluster (USM), System Biology Cluster (USM)",
  },
  // Placeholder garbage ("****" and "-") on essentially-empty USM
  // profile pages -- NULL is more honest than fake characters.
  { slug: "azman-ab-malik", cluster: null },
  { slug: "hazrina-binti-yusof-hamdani", cluster: null },
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
      console.log(`[fixed] ${result[0].name} -> ${JSON.stringify(result[0].research_cluster)}`);
    }
  }
  await sql.end();
}

main();
