"use client";

import { motion } from "framer-motion";

export default function Description() {
  return (
    <section id="film-description" className="relative bg-void/95 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mx-auto max-w-3xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
          Film Description
        </p>
        <p className="mt-6 text-2xl leading-relaxed text-ice/80">
          In a near-future dominated by VR intimacy, a lonely man’s attempt to
          save his long-distance relationship with a high-tech device spirals
          into absurd and horrifying chaos when hackers seize control, forcing
          him to confront unspeakable scenarios in a desperate bid to regain his
          life.
        </p>
      </motion.div>
    </section>
  );
}
