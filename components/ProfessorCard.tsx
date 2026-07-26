import Link from "next/link";

type ProfessorWithTags = {
  id: number;
  slug: string;
  name: string;
  photoUrl: string | null;
  tags: string[];
};

type ProfessorCardProps = {
  professor: ProfessorWithTags;
  isComparing?: boolean;
  onToggleCompare?: (id: number) => void;
  compareDisabled?: boolean; // true when 4 already selected and this one isn't among them
};

export function ProfessorCard({
  professor,
  isComparing = false,
  onToggleCompare,
  compareDisabled = false,
}: ProfessorCardProps) {
  const photo =
    professor.photoUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professor.name)}&background=222&color=fff&size=512`;

  return (
    <article className="prof-card">
      <img src={photo} alt={professor.name} />

      {onToggleCompare && (
        <button
          type="button"
          className={`compare-toggle ${isComparing ? "compare-toggle--active" : ""}`}
          disabled={compareDisabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(professor.id);
          }}
          aria-pressed={isComparing}
          aria-label={isComparing ? "Remove from comparison" : "Add to comparison"}
        >
          {isComparing ? "✓ Comparing" : "+ Compare"}
        </button>
      )}

      <Link href={`/professor/${professor.slug}`} className="prof-link">
        <span className="prof-name">{professor.name}</span>
        <span className="prof-tags">
          {professor.tags.length > 0 ? professor.tags.join(" · ") : "Unlisted"}
        </span>
      </Link>
    </article>
  );
}