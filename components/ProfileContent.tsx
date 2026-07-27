"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { truncate } from "@/lib/truncate";

const MAX_FIELD_LENGTH = 700;

const EASE = [0.23, 1, 0.32, 1] as const;

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: EASE, delay },
  };
}

function DetailRow({
  label,
  value,
  delay,
}: {
  label: string;
  value: string | null | undefined;
  delay: number;
}) {
  if (!value) return null;
  return (
    <motion.div className="detail-row" {...fadeUp(delay)}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </motion.div>
  );
}

type Publication = { id: number; year: number; citation: string };
type Project = {
  id: number;
  title: string;
  role: string | null;
  grantAmount: string | null;
  dateRange: string | null;
};
type Professor = {
  name: string;
  title: string | null;
  photoUrl: string | null;
  email: string | null;
  emailNeedsManualCheck: boolean;
  tel: string | null;
  room: string | null;
  researchCluster: string | null;
  researchInterest: string | null;
  specialization: string | null;
  profileUrl: string | null;
  tags: string[];
};

export function ProfileContent({
  professor,
  publications,
  projects,
}: {
  professor: Professor;
  publications: Publication[];
  projects: Project[];
}) {
  const publicationsByYear = publications.reduce((acc, pub) => {
    acc[pub.year] = acc[pub.year] || [];
    acc[pub.year].push(pub);
    return acc;
  }, {} as Record<number, Publication[]>);
  const years = Object.keys(publicationsByYear).map(Number).sort((a, b) => b - a);

  return (
    <main>
      <div className="profile-header">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Link href="/" className="profile-back-link">
            &larr; back to catalog
          </Link>
        </motion.div>

        <div className="profile-header-row">
          <motion.div
            className="profile-photo-frame"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {professor.photoUrl ? (
              <img src={professor.photoUrl} alt={professor.name} className="profile-photo" />
            ) : (
              <div className="profile-photo profile-photo--placeholder" />
            )}
          </motion.div>

          <div className="profile-header-info">
            <motion.h1 className="profile-name" {...fadeUp(0.1)}>
              {professor.name}
            </motion.h1>
            {professor.title && (
              <motion.p className="profile-title" {...fadeUp(0.15)}>
                {professor.title}
              </motion.p>
            )}

            {professor.tags.length > 0 && (
              <motion.div
                className="profile-tags"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {professor.tags.map((tag, i) => (
                  <motion.span
                    key={tag}
                    className="profile-tag-pill"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.25 + i * 0.06,
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                    }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            )}

            <div className="detail-block">
              <DetailRow
                label="Email"
                value={
                  professor.emailNeedsManualCheck
                    ? "not listed — check department directory"
                    : professor.email
                }
                delay={0.3}
              />
              <DetailRow label="Tel" value={professor.tel} delay={0.34} />
              <DetailRow label="Room" value={professor.room} delay={0.38} />
              <DetailRow label="Cluster" value={professor.researchCluster} delay={0.42} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only quick nav -- desktop hides this via CSS since
          scrolling isn't a problem there. Jump-links avoid the "endless
          scroll" feel on small screens by letting a student go straight
          to Publications or Projects without hunting. */}
      <nav className="profile-quick-nav">
        {professor.researchInterest && (
          <a href="#research-interest" className="profile-quick-nav-link">Interest</a>
        )}
        {professor.specialization && (
          <a href="#specialization" className="profile-quick-nav-link">Specialization</a>
        )}
        <a href="#projects" className="profile-quick-nav-link">Projects</a>
        {years.length > 0 && (
          <a href="#publications" className="profile-quick-nav-link">Publications</a>
        )}
      </nav>

      <div className="profile-details">
        {professor.researchInterest && (
          <motion.div className="profile-section" id="research-interest" {...fadeUp(0.1)}>
            <h2 className="profile-section-heading">Research Interest</h2>
            <p className="profile-section-text">{truncate(professor.researchInterest, MAX_FIELD_LENGTH)}</p>
          </motion.div>
        )}

        {professor.specialization && (
          <motion.div className="profile-section" id="specialization" {...fadeUp(0.16)}>
            <h2 className="profile-section-heading">Specialization</h2>
            <p className="profile-section-text">{truncate(professor.specialization, MAX_FIELD_LENGTH)}</p>
          </motion.div>
        )}

        {projects.length > 0 ? (
          <motion.div className="profile-section" id="projects" {...fadeUp(0.22)}>
            <h2 className="profile-section-heading">Projects</h2>
            <div className="project-list">
              {projects.map((proj, i) => (
                <motion.div
                  key={proj.id}
                  className="project-card"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
                >
                  <p className="project-title">{proj.title}</p>
                  <div className="project-meta">
                    {proj.role && <span className="project-role">{proj.role}</span>}
                    {proj.grantAmount && <span className="project-amount">{proj.grantAmount}</span>}
                    {proj.dateRange && <span className="project-dates">{proj.dateRange}</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div className="profile-section" id="projects" {...fadeUp(0.22)}>
            <h2 className="profile-section-heading">Projects</h2>
            <p className="profile-section-text profile-section-text--muted">
              No projects listed yet.
            </p>
          </motion.div>
        )}

        {years.length > 0 && (
          <motion.div className="profile-section" id="publications" {...fadeUp(0.28)}>
            <h2 className="profile-section-heading">Publications</h2>
            {years.map((year) => (
              <div key={year} className="publication-year-group">
                <p className="publication-year">{year}</p>
                {publicationsByYear[year].map((pub, i) => (
                  <motion.p
                    key={pub.id}
                    className="publication-citation"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  >
                    {pub.citation}
                  </motion.p>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {professor.profileUrl && (
          <motion.div className="profile-section" {...fadeUp(0.34)}>
            <a
              href={professor.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-usm-link"
            >
              view official USM profile &rarr;
            </a>
          </motion.div>
        )}
      </div>
    </main>
  );
}