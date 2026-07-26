// lib/truncate.ts
//
// Defensive truncation for any scraped free-text field. Even after we fix
// the scraper's end-label detection, this stays in place as a safety net --
// a single malformed source page should never be able to blow up a card's
// layout, no matter what ends up in the database.
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}