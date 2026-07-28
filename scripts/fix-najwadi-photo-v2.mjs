// scripts/fix-najwadi-photo-v2.mjs
// Correcting to the Acad_Staf folder path, matching the pattern every
// other working professor photo uses -- the "Formal" jpeg lived outside
// that folder and wasn't loading correctly in production.
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function main() {
  const result = await sql`
    UPDATE professors
    SET photo_url = 'https://cs.usm.my/images/Acad_Staf/Najwadi2.png'
    WHERE slug = 'mohd-najwadi-yusoff'
    RETURNING id, name, photo_url
  `;
  console.log(result.length ? `[fixed] ${result[0].name} -> ${result[0].photo_url}` : "[not found]");
  await sql.end();
}

main();
