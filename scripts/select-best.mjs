// scripts/select-best.mjs
//
// Reads docs/data-collection/publications-projects-raw.json (from the
// scraper) and applies the selection rules:
//   - Publications: 2 most recent per year, for the 3 most recent years
//     that actually have entries (skip years with zero entries)
//   - Projects: top 2 by (Project Leader first, then largest Grant Amount)
//
// Outputs docs/data-collection/publications-projects-selected.json,
// which seed-publications-projects.mjs then loads into the DB.

import fs from "node:fs/promises";

const INPUT_JSON = "docs/data-collection/publications-projects-raw.json";
const OUTPUT_JSON = "docs/data-collection/publications-projects-selected.json";

function parseGrantAmount(amountStr) {
  if (!amountStr) return 0;
  // "RM35,000" / "RM 325,340.00" -> 35000 / 325340
  const match = amountStr.replace(/,/g, "").match(/[\d.]+/);
  return match ? Math.round(parseFloat(match[0])) : 0;
}

function selectPublications(byYear) {
  const years = Object.keys(byYear)
    .map(Number)
    .filter((y) => byYear[y] && byYear[y].length > 0)
    .sort((a, b) => b - a) // newest first
    .slice(0, 3); // 3 most recent non-empty years

  const selected = [];
  for (const year of years) {
    const picks = byYear[year].slice(0, 2); // first 2 listed for that year
    for (const citation of picks) {
      selected.push({ year, citation });
    }
  }
  return selected; // up to 6
}

function selectProjects(projects) {
  const scored = projects.map((p) => ({
    ...p,
    _isLeader: /project leader/i.test(p.role || "") ? 1 : 0,
    _amount: parseGrantAmount(p.grantAmount),
  }));

  scored.sort((a, b) => {
    if (b._isLeader !== a._isLeader) return b._isLeader - a._isLeader;
    return b._amount - a._amount;
  });

  return scored.slice(0, 2).map(({ _isLeader, _amount, ...rest }) => rest);
}

async function main() {
  const raw = JSON.parse(await fs.readFile(INPUT_JSON, "utf-8"));
  const selected = {};

  for (const [slug, data] of Object.entries(raw)) {
    if (data.error) {
      selected[slug] = { error: data.error };
      continue;
    }
    selected[slug] = {
      publications: selectPublications(data.publicationsByYear || {}),
      projects: selectProjects(data.projects || []),
      projectsEmpty: data.projectsEmpty,
      publicationsEmpty: data.publicationsEmpty,
    };
  }

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(selected, null, 2));

  // Quick summary so you can spot professors needing manual review
  const noProjects = Object.entries(selected).filter(([, v]) => v.projectsEmpty).map(([k]) => k);
  const noPubs = Object.entries(selected).filter(([, v]) => v.publicationsEmpty).map(([k]) => k);
  console.log(`Done. Wrote ${OUTPUT_JSON}`);
  console.log(`\nProfessors with no projects listed (${noProjects.length}):`);
  console.log(noProjects.join(", "));
  console.log(`\nProfessors with no publications found (${noPubs.length}):`);
  console.log(noPubs.join(", "));
}

main();
