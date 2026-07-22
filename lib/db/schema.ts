// lib/db/schema.ts
//
// Milestone 3 schema: just enough to display the professor directory.
// Deliberately does NOT include a ResearchArea tag table yet -- that's
// a Milestone 4 decision (how do we normalize free-text research interests
// into filterable tags?). Building it now would mean guessing at a tagging
// scheme before we know what filters we actually need.

import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const professors = pgTable("professors", {
  id: serial("id").primaryKey(),

  // Identity
  name: text("name").notNull(),        // e.g. "Aman Jantan"
  title: text("title"),                 // e.g. "Associate Professor Dr."
  slug: text("slug").notNull().unique(), // e.g. "aman-jantan" -- used in /professor/[slug]

  // Contact
  email: text("email"),
  emailNeedsManualCheck: boolean("email_needs_manual_check").notNull().default(false),
  tel: text("tel"),
  fax: text("fax"),
  room: text("room"),

  // Research (free text for now -- see note above)
  researchCluster: text("research_cluster"),
  researchInterest: text("research_interest"),
  specialization: text("specialization"),

  // Source traceability -- always know where a record came from (Rule 3/4)
  profileUrl: text("profile_url").notNull().unique(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Professor = typeof professors.$inferSelect;
export type NewProfessor = typeof professors.$inferInsert;
