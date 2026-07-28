// scripts/fix-najwadi-photo.mjs
import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function main() {
  const result = await sql`
    UPDATE professors
    SET photo_url = 'https://cs.usm.my/images/Najwadi_-_Formal.jpeg',
        photo_needs_manual_check = false
    WHERE slug = 'mohd-najwadi-yusoff'
    RETURNING id, name, photo_url
  `;
  console.log(result.length ? `[fixed] ${result[0].name} -> ${result[0].photo_url}` : "[not found]");
  await sql.end();
}

main();
