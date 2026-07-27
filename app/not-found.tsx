// app/not-found.tsx
// Next.js shows this automatically for any unmatched route, or when
// notFound() is called (like your professor/[slug]/page.tsx already
// does for an invalid slug).
"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.23, 1, 0.32, 1] as const;

export default function NotFound() {
  return (
    <main className="not-found-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <p className="not-found-eyebrow">404</p>
        <h1 className="not-found-title">This professor isn't in our records.</h1>
        <p className="not-found-subtitle">
          The page you're looking for doesn't exist -- maybe a typo in the link,
          or a profile that's since moved.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Link href="/" className="not-found-link">
            &larr; back to the full directory
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}