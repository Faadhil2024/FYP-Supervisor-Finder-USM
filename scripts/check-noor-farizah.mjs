import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const [prof] = await sql`SELECT id, name, slug, research_cluster, specialization, research_interest FROM professors WHERE slug = 'noor-farizah-ibrahim'`;
const tags = await sql`SELECT tag FROM professor_tags WHERE professor_id = ${prof.id}`;

console.log(JSON.stringify({ ...prof, tags: tags.map(t => t.tag) }, null, 2));
await sql.end();
