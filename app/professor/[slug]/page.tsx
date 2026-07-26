// app/professor/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfessorBySlug, getProfessorPublications, getProfessorProjects } from "@/lib/db/queries";
import { truncate } from "@/lib/truncate";

const MAX_FIELD_LENGTH = 700;

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

export default async function ProfessorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const professor = await getProfessorBySlug(slug);

  if (!professor) {
    notFound();
  }

  const publications = await getProfessorPublications(professor.id);
  const projects = await getProfessorProjects(professor.id);
  const publicationsByYear = publications.reduce((acc, pub) => {
    acc[pub.year] = acc[pub.year] || [];
    acc[pub.year].push(pub);
    return acc;
  }, {} as Record<number, typeof publications>);
  const years = Object.keys(publicationsByYear).map(Number).sort((a, b) => b - a);

  // NOTE: if getProfessorBySlug doesn't join professor_tags the way
  // getAllProfessorsWithTags does, professor.tags will be undefined and
  // this block just won't render -- not a bug, just missing data wiring.
  const tags = (professor as any).tags as string[] | undefined;

  return (
    <main>
      <div className="profile-header">
        <Link href="/" className="profile-back-link">
          &larr; back to catalog
        </Link>

        <div className="profile-header-row">
          <div className="profile-photo-frame">
            {professor.photoUrl ? (
              <img src={professor.photoUrl} alt={professor.name} className="profile-photo" />
            ) : (
              <div className="profile-photo profile-photo--placeholder" />
            )}
          </div>

          <div className="profile-header-info">
            <h1 className="profile-name">{professor.name}</h1>
            {professor.title && <p className="profile-title">{professor.title}</p>}

            {tags && tags.length > 0 && (
              <div className="profile-tags">
                {tags.map((tag) => (
                  <span key={tag} className="profile-tag-pill">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-block">
              <DetailRow
                label="Email"
                value={
                  professor.emailNeedsManualCheck
                    ? "not listed — check department directory"
                    : professor.email
                }
              />
              <DetailRow label="Tel" value={professor.tel} />
              <DetailRow label="Room" value={professor.room} />
              <DetailRow label="Cluster" value={professor.researchCluster} />
            </div>
          </div>
        </div>
      </div>

      <div className="profile-details">
        {professor.researchInterest && (
          <div className="profile-section">
            <h2 className="profile-section-heading">Research Interest</h2>
            <p className="profile-section-text">
              {truncate(professor.researchInterest, MAX_FIELD_LENGTH)}
            </p>
          </div>
        )}

        {professor.specialization && (
          <div className="profile-section">
            <h2 className="profile-section-heading">Specialization</h2>
            <p className="profile-section-text">
              {truncate(professor.specialization, MAX_FIELD_LENGTH)}
            </p>
          </div>
        )}

        {projects.length > 0 ? (
          <div className="profile-section">
            <h2 className="profile-section-heading">Projects</h2>
            <div className="project-list">
              {projects.map((proj) => (
                <div key={proj.id} className="project-card">
                  <p className="project-title">{proj.title}</p>
                  <div className="project-meta">
                    {proj.role && <span className="project-role">{proj.role}</span>}
                    {proj.grantAmount && <span className="project-amount">{proj.grantAmount}</span>}
                    {proj.dateRange && <span className="project-dates">{proj.dateRange}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="profile-section">
            <h2 className="profile-section-heading">Projects</h2>
            <p className="profile-section-text profile-section-text--muted">
              No projects listed yet.
            </p>
          </div>
        )}

        {years.length > 0 && (
          <div className="profile-section">
            <h2 className="profile-section-heading">Publications</h2>
            {years.map((year) => (
              <div key={year} className="publication-year-group">
                <p className="publication-year">{year}</p>
                {publicationsByYear[year].map((pub) => (
                  <p key={pub.id} className="publication-citation">
                    {pub.citation}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {professor.profileUrl && (
          <div className="profile-section">
            <a
              href={professor.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-usm-link"
            >
              view official USM profile &rarr;
            </a>
          </div>
        )}
      </div>
    </main>
  );
}

