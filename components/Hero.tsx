"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import posterImage from "@/images/Crak Hack Poster - 26 SMALL.jpg";

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
          className="mt-12 w-full max-w-md overflow-hidden rounded-2xl border border-hud/20 bg-black/40 shadow-glow lg:mt-0"
          style={{ aspectRatio: "2 / 3" }}
        >
          <div className="relative h-full w-full">
            <Image
              src={posterImage}
              alt="CRAK HACK film poster"
              fill
              priority
              sizes="(min-width: 1024px) 28rem, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70" />
          </div>
        </motion.div>
      </div>

      <motion.a
        href="#film-description"
        aria-label="Scroll down"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9, y: [0, 8, 0] }}
        transition={{ duration: 1.8, delay: 1.0, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center rounded-full border border-hud/30 bg-black/40 px-4 py-3 text-ice/70 shadow-glow backdrop-blur-sm transition hover:border-hud/60 hover:text-ice"
      >
        <span className="sr-only">Scroll down</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5.5 7.5L10 12l4.5-4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.a>
    </section>
  );
}
