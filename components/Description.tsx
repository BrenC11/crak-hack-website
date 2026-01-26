"use client";

import { motion } from "framer-motion";

export default function Description() {
  return (
    <section className="relative bg-void px-6 py-24">
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
          A sci-fi horror about a man whose VR headset is hacked. The world
          around him dulls, then distorts, then refuses to let him go.
        </p>
      </motion.div>
    </section>
  );
}
