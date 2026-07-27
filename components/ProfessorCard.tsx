"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

type ProfessorWithTags = {
  id: number;
  slug: string;
  name: string;
  photoUrl: string | null;
  tags: string[];
};

type ProfessorCardProps = {
  professor: ProfessorWithTags;
  isComparing?: boolean;
  onToggleCompare?: (id: number) => void;
  compareDisabled?: boolean;
  index?: number; // for stagger timing from the grid
};

export function ProfessorCard({
  professor,
  isComparing = false,
  onToggleCompare,
  compareDisabled = false,
  index = 0,
}: ProfessorCardProps) {
  const photo =
    professor.photoUrl ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(professor.name)}&background=222&color=fff&size=512`;

  // Mouse-tracked spring tilt -- tied to a spring, not raw mouse position,
  // so it settles physically instead of snapping (Emil Kowalski: mouse
  // interactions feel artificial without a spring).
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.article
      ref={ref}
      className="prof-card"
      layout
      exit={{ opacity: 0, scale: 0.96 }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
        delay: Math.min(index * 0.05, 0.4),
      }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.img
        src={photo}
        alt={professor.name}
        style={{ transform: "translateZ(0)" }}
        whileHover={{ scale: 1.08 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      />

      {onToggleCompare && (
        <motion.button
          type="button"
          className={`compare-toggle ${isComparing ? "compare-toggle--active" : ""}`}
          disabled={compareDisabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(professor.id);
          }}
          whileTap={{ scale: 0.94 }}
          aria-pressed={isComparing}
          aria-label={isComparing ? "Remove from comparison" : "Add to comparison"}
        >
          {isComparing ? "✓ Comparing" : "+ Compare"}
        </motion.button>
      )}

      <Link href={`/professor/${professor.slug}`} className="prof-link">
        <span className="prof-name">{professor.name}</span>
        <span className="prof-tags">
          {professor.tags.length > 0 ? professor.tags.join(" · ") : "Unlisted"}
        </span>
      </Link>
    </motion.article>
  );
}