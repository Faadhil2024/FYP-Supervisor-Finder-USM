import { getAllProfessorsWithTags } from "@/lib/db/queries";
import { ProfessorCatalog } from "@/components/ProfessorCatalog";

export default async function HomePage() {
  const professors = await getAllProfessorsWithTags();

  return (
    <main>
      <section className="hero-section">
        <p className="hero-eyebrow">
          USM School of Computer Sciences
        </p>
        <h1 className="hero-title">
          Every student wonders which professor to choose.
        </h1>
        <p className="hero-subtitle">
          Don&apos;t worry, we got you.
        </p>
      </section>

      <ProfessorCatalog professors={professors} />
    </main>
  );
}