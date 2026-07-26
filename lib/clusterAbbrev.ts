// lib/clusterAbbrev.ts
//
// Maps the 3 official USM CS research clusters to short codes for the
// catalog tab badges. Confirmed against the school's own page
// (cs.usm.my/.../school-of-computer-sciences) -- not guessed.
const CLUSTER_ABBREVIATIONS: Record<string, string> = {
  "data to knowledge": "D2K",
  "service computing": "SC",
  "enabling technologies and infrastructures": "ETI",
  "enabling technologies & infrastructures": "ETI",
  "enabling technologies & infrastructure": "ETI",
};

export function getClusterAbbreviation(cluster: string | null): string {
  if (!cluster) return "—";
  const normalized = cluster.trim().toLowerCase();
  return CLUSTER_ABBREVIATIONS[normalized] ?? cluster.slice(0, 3).toUpperCase();
}