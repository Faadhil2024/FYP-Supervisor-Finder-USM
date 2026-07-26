// lib/db/queries.ts
import { db } from "./client";
import { professors, professorTags, professorPublications, professorProjects } from "./schema";
import { eq, inArray } from "drizzle-orm";

export async function getAllProfessorsWithTags() {
  const allProfessors = await db.select().from(professors).orderBy(professors.name);
  const allTags = await db.select().from(professorTags);

  const tagsByProfessorId = new Map();
  for (const t of allTags) {
    const existing = tagsByProfessorId.get(t.professorId) ?? [];
    existing.push(t.tag);
    tagsByProfessorId.set(t.professorId, existing);
  }

  return allProfessors.map((p) => ({
    ...p,
    tags: tagsByProfessorId.get(p.id) ?? [],
  }));
}

export async function getProfessorBySlug(slug: string) {
  const rows = await db.select().from(professors).where(eq(professors.slug, slug)).limit(1);
  const professor = rows[0];
  if (!professor) return null;

  const tags = await db
    .select()
    .from(professorTags)
    .where(eq(professorTags.professorId, professor.id));

  return { ...professor, tags: tags.map((t) => t.tag) };
}

export async function getProfessorPublications(professorId: number) {
  return db
    .select()
    .from(professorPublications)
    .where(eq(professorPublications.professorId, professorId))
    .orderBy(professorPublications.year); // ascending; reverse in UI if you want newest-first
}

export async function getProfessorProjects(professorId: number) {
  return db
    .select()
    .from(professorProjects)
    .where(eq(professorProjects.professorId, professorId));
}

// Fetches full comparison data (tags, publications, projects) for a set
// of professor IDs in 4 queries total, not N+1 per professor. Used by
// app/compare/page.tsx.
export async function getProfessorsForComparison(ids: number[]) {
  if (ids.length === 0) return [];

  const profs = await db.select().from(professors).where(inArray(professors.id, ids));

  const tags = await db
    .select()
    .from(professorTags)
    .where(inArray(professorTags.professorId, ids));

  const publications = await db
    .select()
    .from(professorPublications)
    .where(inArray(professorPublications.professorId, ids));

  const projects = await db
    .select()
    .from(professorProjects)
    .where(inArray(professorProjects.professorId, ids));

  return profs.map((prof) => ({
    ...prof,
    tags: tags.filter((t) => t.professorId === prof.id).map((t) => t.tag),
    publications: publications
      .filter((p) => p.professorId === prof.id)
      .sort((a, b) => b.year - a.year),
    projects: projects.filter((p) => p.professorId === prof.id),
  }));
}