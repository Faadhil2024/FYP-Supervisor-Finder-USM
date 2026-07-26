// scripts/manual-project-inserts.mjs
//
// Manually curated project picks for professors whose USM page had no
// structured project data. Sourced via web search / Google Scholar /
// professor's own site where USM's own profile page had nothing.
// Safe to re-run -- duplicate check on (professor_id, title).

import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

const PROJECTS = [
  // -- Zainab Ajab Mohideen --
  {
    slug: "zainab-ajab-mohideen",
    grantName: null,
    grantAmount: "RM36,400.00",
    role: "Co-researcher",
    title: "Fundamental Framework Toward the Digital Horizon: Innovations, Resilience, and Smart Strategies for Sustainability of Libraries",
    dateRange: "01/09/2025 - 08/07/2029",
  },

  // -- Wan Mohd Nazmee Wan Zainon --
  {
    slug: "wan-mohd-nazmee-wan-zainon",
    grantName: "USM Research University - Individual (RUI) Grant",
    grantAmount: "RM162,584.52",
    role: "Principal Investigator",
    title: "Medical Family Tree Data Exploration Using Visual Data Mining",
    dateRange: "15/12/2012 - 14/12/2015",
  },
  {
    slug: "wan-mohd-nazmee-wan-zainon",
    grantName: "USM Research University - Individual (RUI) Grant",
    grantAmount: "RM69,200.00",
    role: "Principal Investigator",
    title: "A Visual Approach for Understanding Heredity Information Based on Medical Genogram",
    dateRange: "March 2017 - February 2019",
  },

  // -- Ahmad Sufril Azlan Mohamed (from grant codes found in his co-authored papers) --
  {
    slug: "ahmad-sufril-azlan-mohamed",
    grantName: "Fundamental Research Grant Scheme (FRGS) - FRGS/1/2020/STG06/USM/02/4",
    grantAmount: null,
    role: "Co-researcher",
    title: "Enhanced Firefly Algorithm and Genetic Algorithm Approaches for Mobile Robot Global Path Planning",
    dateRange: null,
  },
  {
    slug: "ahmad-sufril-azlan-mohamed",
    grantName: "Fundamental Research Grant Scheme (FRGS) - Grant 203/PKOMP/6711932",
    grantAmount: null,
    role: "Researcher",
    title: "EfficientNet-Lite and Hybrid CNN-KNN for Facial Expression Recognition on Raspberry Pi",
    dateRange: null,
  },

  // -- Nurul Hashimah Ahamed Hassain Malim --
  {
    slug: "nurul-hashimah-ahamed-hassain-malim",
    grantName: "Transdisciplinary Research Grant Scheme (TRGS), MOHE",
    grantAmount: "RM158,500",
    role: "Project Head",
    title: "Sensor-based Profiling and Predictive Analytics of Solar Flux and Water Quality on the Seawater Aquaculture Farm",
    dateRange: "2018-2021",
  },
  {
    slug: "nurul-hashimah-ahamed-hassain-malim",
    grantName: "Fundamental Research Grant Scheme (FRGS), MOHE",
    grantAmount: "RM95,800",
    role: "Project Head",
    title: "A Framework for the Reconstruction of Protein Target Activity Prediction Model of Malaysian Therapeutic Natural Products using an Optimized Deep Learning Approach",
    dateRange: "2019-2022",
  },

  // -- Nursakirah Ab Rahman Muton --
  {
    slug: "nursakirah-ab-rahman-muton",
    grantName: null,
    grantAmount: null,
    role: "Principal Investigator",
    title: "A Theoretical Framework for Culturally Adaptive User Experience (UX) Design for Virtual Collaboration among University Students",
    dateRange: "2026 - ongoing",
  },
  {
    slug: "nursakirah-ab-rahman-muton",
    grantName: "CREST Grant",
    grantAmount: null,
    role: "Co-researcher",
    title: "Development of a Superior Modular Production Solution Compliance with Industry 4.0 with 3-dimensional Simulation and Digital Twin Toolkit with Artificial Intelligence and Augmented Reality Capabilities",
    dateRange: "2024-2025",
  },

  // -- Mohd Najwadi Yusoff --
  {
    slug: "mohd-najwadi-yusoff",
    grantName: "International Grant",
    grantAmount: null,
    role: "Project Leader",
    title: "DDoS Attack Detection Framework using Machine Learning in Software Defined Network",
    dateRange: null,
  },
  {
    slug: "mohd-najwadi-yusoff",
    grantName: "National Grant (FRGS)",
    grantAmount: null,
    role: "Project Leader",
    title: "A Framework for Detecting Fileless Cryptocurrency Mining Malware in Blockchain Technology",
    dateRange: null,
  },

  // -- Manmeet Kaur Mahinderjit Singh --
  {
    slug: "manmeet-kaur-mahinderjit-singh",
    grantName: "Fundamental National Grant",
    grantAmount: null,
    role: null,
    title: "Advanced Persistent Threat Attacks Defender and Remediation Model using Behavioural-Based Tactics, Techniques and Procedures (TTP) for Smartphone Environment",
    dateRange: "2020-2024, Ongoing",
  },
  {
    slug: "manmeet-kaur-mahinderjit-singh",
    grantName: "Long Term National Research Grant",
    grantAmount: null,
    role: null,
    title: "Shaping Pro-Environment Behaviours",
    dateRange: "Ongoing",
  },

  // -- Lim Chia Yean --
  {
    slug: "lim-chia-yean",
    grantName: "USM RUTeam Grant",
    grantAmount: null,
    role: "Project Leader",
    title: "AI-Based Multimodal Behavioural Biometrics Authentication and Real-Time Trust Scoring for Fraud Prevention in Mobile Digital Banking",
    dateRange: "01/11/2025 - 31/10/2028",
  },
  {
    slug: "lim-chia-yean",
    grantName: "USM Short Term Grant",
    grantAmount: null,
    role: "Project Leader",
    title: "The Usability Evaluation Framework for Malaysia Higher Education Institution's Learning Management System (LMS)",
    dateRange: "July 2023 - June 2025",
  },

  // -- Fadratul Hafinaz Hassan --
  {
    slug: "fadratul-hafinaz-hassan",
    grantName: "Prototype Research Grant Scheme (PRGS)",
    grantAmount: null,
    role: "Project Leader",
    title: "Development of a Smart Spatial Simulation System for Congestion Detection (S4-CD)",
    dateRange: "2021-2023",
  },
  {
    slug: "fadratul-hafinaz-hassan",
    grantName: "Hubert-Curien Partnership Malaysia and France (PHC-HIBISCUS)",
    grantAmount: null,
    role: "Project Leader",
    title: "Modelling of Pedestrian Crowd Dynamics, in the Presence of Social Groups and Heterogeneous Pedestrians",
    dateRange: "2020-2022",
  },

  // -- Chong Yung Wey --
  {
    slug: "chong-yung-wey",
    grantName: "International Grant",
    grantAmount: null,
    role: null,
    title: "PEP-star: A Performance Enhancing Proxy for Low Earth Orbit Satellite Communications in Disaster-Resilient ASEAN Network Infrastructure",
    dateRange: null,
  },
  {
    slug: "chong-yung-wey",
    grantName: "International Grant",
    grantAmount: null,
    role: null,
    title: "AISC: Artificial Intelligence Research Development and Innovation Network for Sustainable Cities",
    dateRange: null,
  },
];

async function main() {
  let inserted = 0;
  let skipped = 0;

  for (const p of PROJECTS) {
    const [prof] = await sql`SELECT id FROM professors WHERE slug = ${p.slug}`;
    if (!prof) {
      console.warn(`[skip] no professor found for slug ${p.slug}`);
      continue;
    }

    const existing = await sql`
      SELECT id FROM professor_projects
      WHERE professor_id = ${prof.id} AND title = ${p.title}
    `;
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await sql`
      INSERT INTO professor_projects
        (professor_id, grant_name, grant_amount, role, title, date_range, is_selected)
      VALUES (
        ${prof.id}, ${p.grantName}, ${p.grantAmount},
        ${p.role}, ${p.title}, ${p.dateRange}, true
      )
    `;
    inserted++;
    console.log(`[inserted] ${p.slug} - "${p.title.slice(0, 60)}..."`);
  }

  console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} already-existing.`);
  await sql.end();
}

main();
