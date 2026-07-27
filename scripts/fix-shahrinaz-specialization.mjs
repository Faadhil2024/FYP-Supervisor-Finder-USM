// scripts/fix-shahrinaz-specialization.mjs
//
// Same case-sensitivity bug as Najwadi, different weird variant: her
// USM page heading is literally "SpecializatioN" (mixed case, capital
// N), which the scraper's exact-string match missed.

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function main() {
  const result = await sql`
    UPDATE professors
    SET specialization = 'Conceptual Modelling for Real-World Digital Solutions'
    WHERE slug = 'shahrinaz-ismail'
    RETURNING id, name, specialization
  `;
  console.log(result.length ? `[fixed] ${result[0].name}` : "[not found]");
  await sql.end();
}

main();
