"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProfessorCard } from "./ProfessorCard";
import { CompareBar } from "./CompareBar";
import { tokenizeQuery, expandQueryWords, matchesAnyTerm } from "@/lib/synonyms";

type ProfessorWithTags = {
  id: number;
  slug: string;
  name: string;
  photoUrl: string | null;
  tags: string[];
  researchInterest: string | null;
  specialization: string | null;
};

const ALL_TAGS = ["SE", "IC", "CI"];
const COMPARE_STORAGE_KEY = "fyp-supervisor-finder-compare-ids";
const MAX_COMPARE = 4;

export function ProfessorCatalog({ professors }: { professors: ProfessorWithTags[] }) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) setCompareIds(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch {}
  }, [compareIds, hydrated]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleCompare(id: number) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  function clearCompare() {
    setCompareIds([]);
  }

  const filtered = useMemo(() => {
    const words = tokenizeQuery(query);
    const expandedWords = expandQueryWords(words);
    return professors.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesName = q === "" || p.name.toLowerCase().includes(q);
      const combinedText = [p.researchInterest ?? "", p.specialization ?? ""].join(" ");
      const matchesContent =
        expandedWords.length === 0 || matchesAnyTerm(combinedText, expandedWords);
      const matchesQuery = q === "" || matchesName || matchesContent;
      const matchesTags =
        selectedTags.length === 0 || p.tags.some((t) => selectedTags.includes(t));
      return matchesQuery && matchesTags;
    });
  }, [professors, query, selectedTags]);

  const comparedProfessors = useMemo(
    () => professors.filter((p) => compareIds.includes(p.id)),
    [professors, compareIds]
  );

  return (
    <div>
      <div className="search-bar">
        <motion.input
          type="text"
          placeholder="Search by name or research interest..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        />

        <div className="tag-filter">
          {ALL_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <motion.button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`tag-button ${active ? "tag-button--active" : ""}`}
                whileTap={{ scale: 0.95 }}
                animate={{
                  backgroundColor: active ? "#c8791f" : "#ffffff",
                  borderColor: active ? "#c8791f" : "#14161a",
                  color: active ? "#ffffff" : "#14161a",
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                {tag}
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.p
        className="result-count"
        key={filtered.length} // re-triggers a tiny fade when count changes
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {filtered.length} of {professors.length} professors
      </motion.p>

      <motion.div layout className="catalog-grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((professor, i) => (
            <ProfessorCard
              key={professor.id}
              professor={professor}
              isComparing={compareIds.includes(professor.id)}
              onToggleCompare={toggleCompare}
              compareDisabled={
                compareIds.length >= MAX_COMPARE && !compareIds.includes(professor.id)
              }
              index={i}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {comparedProfessors.length > 0 && (
        <CompareBar professors={comparedProfessors} onClear={clearCompare} onRemove={toggleCompare} />
      )}
    </div>
  );
}