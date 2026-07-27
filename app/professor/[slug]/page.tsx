// app/professor/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getProfessorBySlug, getProfessorPublications, getProfessorProjects } from "@/lib/db/queries";
import { ProfileContent } from "@/components/ProfileContent";

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

  return (
    <ProfileContent
      professor={professor}
      publications={publications}
      projects={projects}
    />
  );
}