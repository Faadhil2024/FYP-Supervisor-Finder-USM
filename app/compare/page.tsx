// app/compare/page.tsx
import Link from "next/link";
import { getProfessorsForComparison } from "@/lib/db/queries";
import { CompareTable } from "@/components/CompareTable";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = (idsParam ?? "")
    .split(",")
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  if (ids.length === 0) {
    return (
      <main className="compare-page">
        <Link href="/" className="profile-back-link profile-back-link--dark">
          &larr; back to catalog
        </Link>
        <p className="compare-empty">
          No professors selected. Go back and tap "+ Compare" on a few profiles.
        </p>
      </main>
    );
  }

  const professors = await getProfessorsForComparison(ids);

  return (
    <main className="compare-page">
      <Link href="/" className="profile-back-link profile-back-link--dark">
        &larr; back to catalog
      </Link>

      <h1 className="compare-title">Comparing {professors.length} professors</h1>

      <CompareTable professors={professors} />
    </main>
  );
}