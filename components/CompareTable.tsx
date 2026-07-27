"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { tokenizeQuery, expandQueryWords } from "@/lib/synonyms";

const EASE = [0.23, 1, 0.32, 1] as const;

type Publication = { id: number; year: number; citation: string };
type Project = { id: number; title: string };
type ProfessorFull = {
  id: number;
  slug: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
  email: string | null;
  emailNeedsManualCheck: boolean;
  room: string | null;
  researchCluster: string | null;
  researchInterest: string | null;
  specialization: string | null;
  tags: string[];
  publications: Publication[];
  projects: Project[];
};

function buildSearchableText(prof: ProfessorFull): string {
  return [
    prof.researchInterest ?? "",
    prof.specialization ?? "",
    prof.tags.join(" "),
    prof.publications.map((p) => p.citation).join(" "),
    prof.projects.map((p) => p.title).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

function scoreProfessor(searchableText: string, queryWords: string[]): number {
  let score = 0;
  for (const word of queryWords) {
    if (word.includes(" ")) {
      score += searchableText.includes(word) ? 2 : 0;
    } else {
      const matches = searchableText.split(word).length - 1;
      score += matches;
    }
  }
  return score;
}

export function CompareTable({ professors }: { professors: ProfessorFull[] }) {
  const [query, setQuery] = useState("");

  const queryWords = useMemo(() => tokenizeQuery(query), [query]);
  const expandedWords = useMemo(() => expandQueryWords(queryWords), [queryWords]);

  const ranked = useMemo(() => {
    if (expandedWords.length === 0) {
      return professors.map((p) => ({ professor: p, score: 0 }));
    }
    return professors
      .map((p) => ({
        professor: p,
        score: scoreProfessor(buildSearchableText(p), expandedWords),
      }))
      .sort((a, b) => b.score - a.score);
  }, [professors, expandedWords]);

  const hasQuery = expandedWords.length > 0;
  const topScore = ranked[0]?.score ?? 0;

  return (
    <div>
      <motion.div
        className="matchmaker-box"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <label htmlFor="matchmaker-input" className="matchmaker-label">
          Not sure who fits best? Describe what you want to work on:
        </label>
        <motion.input
          id="matchmaker-input"
          type="text"
          className="matchmaker-input"
          placeholder="e.g. deep learning for medical imaging, network security, mobile app UX..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        />
        <AnimatePresence>
          {hasQuery && (
            <motion.p
              className="matchmaker-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              Ranked by keyword/topic overlap with research interest, specialization, and recent
              work -- a rough guide, not a guarantee. Read each profile before deciding.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-row-label"></th>
              {ranked.map(({ professor: p, score }, i) => {
                const isBest = hasQuery && score === topScore && score > 0;
                return (
                  <motion.th
                    key={p.id}
                    className={`compare-col-header ${isBest ? "compare-col-header--best" : ""}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE, delay: i * 0.05 }}
                  >
                    <AnimatePresence>
                      {isBest && (
                        <motion.span
                          className="match-badge"
                          initial={{ opacity: 0, scale: 0.5, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        >
                          ★ Best match
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <img
                      src={
                        p.photoUrl ??
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=222&color=fff&size=256`
                      }
                      alt={p.name}
                      className="compare-photo"
                    />
                    <Link href={`/professor/${p.slug}`} className="compare-name-link">
                      {p.name}
                    </Link>
                    {p.title && <p className="compare-subtitle">{p.title}</p>}
                    <AnimatePresence mode="wait">
                      {hasQuery && (
                        <motion.p
                          key={score}
                          className="match-score"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                        >
                          {score > 0
                            ? `${score} keyword match${score === 1 ? "" : "es"}`
                            : "No overlap found"}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="compare-row-label">Tags</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>{p.tags.length > 0 ? p.tags.join(", ") : "—"}</td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Cluster</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>{p.researchCluster ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Research Interest</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>{p.researchInterest ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Specialization</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>{p.specialization ?? "—"}</td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Recent Projects</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>
                  {p.projects.length > 0 ? (
                    <ul className="compare-list">
                      {p.projects.map((proj) => (
                        <li key={proj.id}>{proj.title}</li>
                      ))}
                    </ul>
                  ) : (
                    "No projects listed"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Recent Publications</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>
                  {p.publications.length > 0 ? (
                    <ul className="compare-list">
                      {p.publications.slice(0, 4).map((pub) => (
                        <li key={pub.id}>
                          <span className="compare-pub-year">{pub.year}</span> —{" "}
                          {pub.citation.split(".")[0]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No publications found"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label">Contact</td>
              {ranked.map(({ professor: p }) => (
                <td key={p.id}>
                  {p.emailNeedsManualCheck ? "not listed" : p.email}
                  <br />
                  Room {p.room ?? "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}