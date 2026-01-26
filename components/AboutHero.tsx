"use client";

import { motion } from "framer-motion";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-24">
      <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-5xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
          Classified Overview
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[0.2em] text-ice sm:text-5xl">
          ABOUT CRAK HACK
        </h1>
        <div className="mt-6 h-px w-40 bg-hud/40 shadow-glow" />
        <p className="mt-6 max-w-2xl text-lg text-ice/70">
          A system file opened. Do not look away.
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-hud/40 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/70 hover:text-ice"
          >
            Return to Main
            <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
