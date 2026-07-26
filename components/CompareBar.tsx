"use client";

import Link from "next/link";

type ProfessorWithTags = {
  id: number;
  slug: string;
  name: string;
  photoUrl: string | null;
  tags: string[];
};

export function CompareBar({
  professors,
  onClear,
  onRemove,
}: {
  professors: ProfessorWithTags[];
  onClear: () => void;
  onRemove: (id: number) => void;
}) {
  const compareUrl = `/compare?ids=${professors.map((p) => p.id).join(",")}`;

  return (
    <div className="compare-bar">
      <div className="compare-bar-names">
        {professors.map((p) => (
          <span key={p.id} className="compare-bar-chip">
            {p.name.split(",")[0]}
            <button
              type="button"
              className="compare-bar-chip-remove"
              onClick={() => onRemove(p.id)}
              aria-label={`Remove ${p.name} from comparison`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      <div className="compare-bar-actions">
        <button type="button" className="compare-bar-clear" onClick={onClear}>
          Clear
        </button>
        <Link href={compareUrl} className="compare-bar-cta">
          Compare ({professors.length})
        </Link>
      </div>
    </div>
  );
}