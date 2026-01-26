"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-void-grid">
      <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
      <div className="absolute inset-0">
        <div className="hud-line left-8 top-12 h-px w-40 animate-hudPulse" />
        <div className="hud-line right-10 top-20 h-px w-28 animate-hudPulse" />
        <div className="hud-line-hack left-16 bottom-24 h-px w-44 animate-hudPulse" />
        <div className="hud-line right-14 bottom-16 h-px w-32 animate-hudPulse" />
        <div className="hud-line-hack left-8 top-12 h-24 w-px animate-hudPulse" />
        <div className="hud-line right-10 top-20 h-28 w-px animate-hudPulse" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
            A Short Film by Brendan Cleaves
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[0.2em] text-ice sm:text-6xl lg:text-7xl">
            CRAK HACK
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ice/70">
            A signal slips in. The visor stays on. Reality glitches.
          </p>
          <div className="mt-8">
            <a
              href="/about"
              className="inline-flex items-center gap-3 rounded-full border border-hud/40 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/70 hover:text-ice"
            >
              About
              <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="mt-12 h-[420px] w-full max-w-md rounded-2xl border border-hud/20 bg-black/40 shadow-glow lg:mt-0"
        >
          <div className="relative h-full overflow-hidden rounded-2xl">
            <div className="poster-frame absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70" />
            <div className="absolute inset-x-6 bottom-8">
              <p className="text-xs uppercase tracking-[0.3em] text-hud/80">
                Poster Placeholder
              </p>
              <p className="mt-2 text-sm text-ice/60">
                A static frame for a future nightmare.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
