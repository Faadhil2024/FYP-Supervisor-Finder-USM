// scripts/fix-najwadi-specialization.mjs
//
// Fixes the confirmed ALL-CAPS heading bug: his USM page uses
// "SPECIALIZATION" (all caps) instead of "Specialization", which the
// scraper's exact-string heading match missed entirely, leaving the
// field NULL. Correct text extracted from his raw page dump earlier.

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function main() {
  const result = await sql`
    UPDATE professors
    SET specialization = 'Cybersecurity, Cyber Threat Intelligence, Digital Forensics and Incident Response (DFIR), Cryptography and Post-Quantum Cryptography (PQC), AI for Cybersecurity, Blockchain and Decentralized Security, Cybercrime and Privacy Engineering, Secure Protocols and Distributed Systems Security, Critical Information Infrastructure Protection (CII)'
    WHERE slug = 'mohd-najwadi-yusoff'
    RETURNING id, name, specialization
  `;
  console.log(result.length ? `[fixed] ${result[0].name}` : "[not found]");
  await sql.end();
}

main();
