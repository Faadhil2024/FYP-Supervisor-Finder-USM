"use client";

import { useState, useMemo, useEffect } from "react";
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
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareIds));
    } catch {
      // ignore
    }
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
      // Empty search always matches. Otherwise check name (plain
      // substring, since names should still match exactly as typed)
      // OR research interest/specialization via the same synonym
      // expansion the matchmaker uses -- keeps "vision" behaving the
      // same whether you're on the catalog or the compare page.
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
        <input
          type="text"
          placeholder="Search by name or research interest..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <div className="tag-filter">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`tag-button ${selectedTags.includes(tag) ? "tag-button--active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <p className="result-count">
        {filtered.length} of {professors.length} professors
      </p>

      <div className="catalog-grid">
        {filtered.map((professor) => (
          <ProfessorCard
            key={professor.id}
            professor={professor}
            isComparing={compareIds.includes(professor.id)}
            onToggleCompare={toggleCompare}
            compareDisabled={
              compareIds.length >= MAX_COMPARE && !compareIds.includes(professor.id)
            }
          />
        ))}
      </div>

      {comparedProfessors.length > 0 && (
        <CompareBar professors={comparedProfessors} onClear={clearCompare} onRemove={toggleCompare} />
      )}
    </div>
  );
}