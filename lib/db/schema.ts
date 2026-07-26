// lib/db/schema.ts
import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),
  title: text("title"),
  slug: text("slug").notNull().unique(),

  email: text("email"),
  emailNeedsManualCheck: boolean("email_needs_manual_check").notNull().default(false),
  photoUrl: text("photo_url"),
  photoNeedsManualCheck: boolean("photo_needs_manual_check").notNull().default(false),
  tel: text("tel"),
  fax: text("fax"),
  room: text("room"),

  researchCluster: text("research_cluster"),
  researchInterest: text("research_interest"),
  specialization: text("specialization"),

  profileUrl: text("profile_url").notNull().unique(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;

// Many-to-many: a professor can carry multiple programme tags (SE/IC/CI).
// Manually reviewed and finalized from a keyword-matched first pass --
// see docs/data-collection/tag-suggestions.json for that draft, and
// scripts/seed-professor-tags.mjs for the corrected, final assignments.
export const professorTags = pgTable("professor_tags", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),
  tag: text("tag").notNull(), // 'SE' | 'IC' | 'CI'
});

export type ProfessorTag = typeof professorTags.$inferSelect;

// A professor's grant-funded projects, scraped from their USM profile
// page. Selection (which projects count as the "best 2") is decided by
// scripts/select-best.mjs -- isSelected marks the chosen rows so you can
// manually override a pick later without re-running the whole pipeline.
export const professorProjects = pgTable("professor_projects", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),

  grantName: text("grant_name"),
  grantAmount: text("grant_amount"),
  role: text("role"), // 'Project Leader' | 'Co-researcher' | null
  title: text("title").notNull(),
  dateRange: text("date_range"),

  isSelected: boolean("is_selected").notNull().default(true),
});

export type ProfessorProject = typeof professorProjects.$inferSelect;

// A professor's publications, scraped from their USM profile page.
// Selection (2 per year, 3 most recent non-empty years) is decided by
// scripts/select-best.mjs.
export const professorPublications = pgTable("professor_publications", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull(),

  year: integer("year").notNull(),
  citation: text("citation").notNull(),

  isSelected: boolean("is_selected").notNull().default(true),
});

export type ProfessorPublication = typeof professorPublications.$inferSelect;