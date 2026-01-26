"use client";

import { motion } from "framer-motion";

export default function TrailerPlaceholder() {
  return (
    <section className="relative bg-void/95 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.0, ease: "easeOut" }}
        className="mx-auto max-w-5xl"
      >
        <div className="glass-border stream-frame relative overflow-hidden rounded-2xl bg-black/60 p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-x-0 top-0 h-px bg-hud/40" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-hud/30" />
            <div className="absolute left-10 top-8 h-px w-20 bg-hack/60 shadow-hackGlow" />
          </div>
          <div className="relative flex flex-col items-center justify-center gap-6 py-24">
            <div className="h-16 w-16 rounded-full border border-hud/50 shadow-glow" />
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-hud/70">
                Trailer
              </p>
              <p className="mt-3 text-xl text-ice/80">Trailer coming soon</p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
