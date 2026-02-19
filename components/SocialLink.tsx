"use client";

import { motion } from "framer-motion";

export default function SocialLink() {
  return (
    <section className="relative bg-void/95 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4"
      >
        <a
          href="https://www.instagram.com/crakhackfilm"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-full border border-hud/40 bg-black/50 px-8 py-4 text-sm uppercase tracking-[0.3em] text-ice/80 transition duration-300 hover:border-hud/70 hover:text-ice"
          aria-label="CRAK HACK on Instagram"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-hud/50">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 text-hud/80 transition duration-300 group-hover:text-hud"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path
                d="M16.8 3H7.2C5 3 3.2 4.8 3.2 7v10c0 2.2 1.8 4 4 4h9.6c2.2 0 4-1.8 4-4V7c0-2.2-1.8-4-4-4Z"
              />
              <path d="M12 16.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Z" />
              <path d="M17.6 6.4h.01" />
            </svg>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
          Instagram
        </a>
        <a
          href="https://www.imdb.com/title/tt39457194/?ref_=nv_sr_srsg_0_tt_4_nm_4_in_0_q_crak%20hack"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 rounded-full border border-hud/40 bg-black/50 px-8 py-4 text-sm uppercase tracking-[0.3em] text-ice/80 transition duration-300 hover:border-hud/70 hover:text-ice"
          aria-label="CRAK HACK on IMDb"
        >
          <span className="flex h-10 min-w-10 items-center justify-center rounded-full border border-hud/50 px-2 text-xs font-semibold tracking-[0.08em] text-hud/80 transition duration-300 group-hover:text-hud">
            IMDb
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
          IMDb
        </a>
      </motion.div>
    </section>
  );
}
