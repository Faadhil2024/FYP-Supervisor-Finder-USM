// lib/clusterTabs.ts
//
// Maps a research cluster name to one of a fixed set of "catalog tab"
// colors -- the signature visual element (see docs/design-notes.md).
// Hash-based rather than a hardcoded list, so it stays correct even if
// USM adds new cluster names later without code changes.

const TAB_COLORS = [
  { bg: "#9C6B30", label: "brass" },   // ochre
  { bg: "#3F6355", label: "pine" },    // green
  { bg: "#5B4A7A", label: "plum" },    // muted purple
  { bg: "#8C4B3E", label: "clay" },    // rust
  { bg: "#3B5A72", label: "slate" },   // blue-grey
];

export function getClusterTabColor(cluster: string | null): string {
  if (!cluster) return "#9B9682"; // neutral tab for "cluster not listed"
  let hash = 0;
  for (let i = 0; i < cluster.length; i++) {
    hash = (hash << 5) - hash + cluster.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAB_COLORS.length;
  return TAB_COLORS[index].bg;
}
