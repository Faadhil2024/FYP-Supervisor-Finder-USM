// scripts/seed-professor-tags.mjs
//
// Seeds the professor_tags table with FINALIZED, manually-reviewed
// SE/IC/CI tags. This is NOT the raw output of suggest-tags.mjs --
// the keyword-matched suggestions were reviewed by hand: 8 professors
// with no keyword match were resolved via cluster fallback or by reading
// their profile text directly, and 8 multi-tag matches were sanity-checked.
//
// Two professors (Azman Ab Malik, Hazrina Yusof Hamdani) have genuinely
// empty/placeholder profiles on USM's own site -- there is no real data
// to tag them from, so they are intentionally left untagged here. Reach
// out to them directly rather than guessing.
//
// One professor (Noor Farizah Ibrahim) has a mismatch between her
// official cluster (Service Computing) and her keyword-matched interests
// (IC/CI) -- tagged per her actual text for now, but worth a manual
// double-check against her real profile.
//
// Usage: node scripts/seed-professor-tags.mjs

import "dotenv/config";
import postgres from "postgres";

// profileUrl -> tags[]. Keyed by profileUrl since it's guaranteed unique
// and stable across re-scrapes (unlike name, which has formatting quirks).
const FINAL_TAGS = {
  "https://cs.usm.my/index.php/faculty-member/164-ahmad-sufril-azlan-mohamed-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/166-aman-jantan-associate-professor-dr": ["SE", "IC", "CI"],
  "https://cs.usm.my/index.php/faculty-member/490-anusha-achuthan-ts-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/167-azizul-rahman-mohd-shariff-dr": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/169-azleena-mohd-kassin-ms": ["IC"],
  // Azman Ab Malik -- profile page has no usable content ("****" placeholders). Unresolved.
  "https://cs.usm.my/index.php/faculty-member/172-chan-huah-yong-associate-professor-dr": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/173-cheah-yu-n-associate-professor-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/174-chew-xin-ying-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/803-chong-yung-wey-dr": ["IC", "CI"],
  "https://cs.usm.my/index.php/faculty-member/175-fadratul-hafinaz-hassan-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/178-gan-keng-hoon-dr": ["IC"], // fallback from D2K cluster
  // Hazrina Yusof Hamdani -- cluster field is empty ("-"). Unresolved.
  "https://cs.usm.my/index.php/faculty-member/181-jasy-liew-suet-yan-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/700-lim-chia-yean-dr": ["SE"],
  "https://cs.usm.my/index.php/faculty-member/182-manmeet-kaur-mahinderjit-singh-dr": ["IC", "CI"],
  "https://cs.usm.my/index.php/faculty-member/784-mohammad-ali-sarvghadi": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/186-mohd-adib-haji-omar-dr": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/185-mohd-azam-osman-mr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/262-mohd-halim-mohd-noor-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/187-mohd-heikal-husin-dr": ["SE"],
  "https://cs.usm.my/index.php/faculty-member/263-mohd-nadhir-ab-wahab-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/188-mohd-najwadi-yusoff-dr": ["CI", "IC"], // read manually -- cybersecurity-heavy, some AI-for-security
  "https://cs.usm.my/index.php/faculty-member/284-noor-farizah-ibrahim-dr": ["IC", "CI"], // NOTE: conflicts with her official "Service Computing" cluster -- verify manually
  "https://cs.usm.my/index.php/faculty-member/191-nor-athiyah-abdullah-dr": ["SE"],
  "https://cs.usm.my/index.php/faculty-member/193-nurhana-samsudin-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/194-nur-intan-raihana-ruhaiyem-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/771-nursakirah-ab-rahman-muton-dr": ["SE"],
  "https://cs.usm.my/index.php/faculty-member/196-nurul-hashimah-ahamad-hassain-malim-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/160-putrasumari": ["SE"], // fallback from Service Computing cluster
  "https://cs.usm.my/index.php/faculty-member/840-ts-dr-ramona-ramli": ["SE", "IC"],
  "https://cs.usm.my/index.php/faculty-member/875-shahrinaz-ismail": ["SE", "IC", "CI"],
  "https://cs.usm.my/index.php/faculty-member/741-siti-hazyanti-binti-mohd-hashim-dr": ["SE"], // fallback from Service Computing cluster
  "https://cs.usm.my/index.php/faculty-member/201-sukumar-letchmunan-dr": ["SE", "IC"],
  "https://cs.usm.my/index.php/faculty-member/264-suzi-iryanti-fadilah-dr": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/202-syaheerah-lebai-lutfi-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/203-tan-tien-ping-dr": ["IC"],
  "https://cs.usm.my/index.php/faculty-member/773-vaithegy-doraisamy": ["CI"],
  "https://cs.usm.my/index.php/faculty-member/206-wan-mohd-nazmee-wan-zainon-dr": ["SE", "IC"],
  "https://cs.usm.my/index.php/faculty-member/208-wong-li-pei-dr": ["IC"], // fallback from D2K cluster
  "https://cs.usm.my/index.php/faculty-member/834-zainab-ajab-mohideen": ["SE"], // fallback from Service Computing cluster
  "https://cs.usm.my/index.php/faculty-member/210-zarul-fitri-zaaba-dr": ["CI"],
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Check your .env file.");
  }

  const sql = postgres(process.env.DATABASE_URL);

  // Look up each professor's real DB id by profileUrl, since that's the
  // stable join key -- ids can shift if the professors table gets reseeded.
  const professors = await sql`select id, profile_url, name from professors`;
  const urlToId = new Map(professors.map((p) => [p.profile_url, p.id]));

  await sql`delete from professor_tags`;

  let inserted = 0;
  let unmatched = [];

  for (const [profileUrl, tags] of Object.entries(FINAL_TAGS)) {
    const professorId = urlToId.get(profileUrl);
    if (!professorId) {
      unmatched.push(profileUrl);
      continue;
    }
    for (const tag of tags) {
      await sql`insert into professor_tags (professor_id, tag) values (${professorId}, ${tag})`;
      inserted++;
    }
  }

  console.log(`Inserted ${inserted} tag rows.`);
  if (unmatched.length > 0) {
    console.log(`WARNING: ${unmatched.length} profileUrls in FINAL_TAGS didn't match any professor in the DB:`);
    unmatched.forEach((u) => console.log(`  - ${u}`));
  }

  const untaggedCount = professors.filter(
    (p) => !FINAL_TAGS[p.profile_url]
  ).length;
  console.log(`${untaggedCount} professors have no tags at all (includes the 2 known unresolved profiles).`);

  await sql.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
