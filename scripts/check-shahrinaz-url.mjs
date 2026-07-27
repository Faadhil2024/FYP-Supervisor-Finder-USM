import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
const rows = await sql`SELECT name, profile_url FROM professors WHERE slug = 'shahrinaz-ismail'`;
console.log(rows);
await sql.end();
