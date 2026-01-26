"use client";

import { motion } from "framer-motion";

export default function FilmStatement() {
  return (
    <section className="relative bg-void/95 px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mx-auto max-w-4xl"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
          Film Statement
        </p>
        <h2 className="mt-5 text-3xl font-semibold tracking-[0.08em] text-ice">
          A dark comedy about control, shame, and the devices we trust.
        </h2>
        <div className="mt-6 space-y-6 text-lg leading-relaxed text-ice/70">
          <p>
            The spark for Crak Hack came from a junk email. One of those absurd
            warnings: “We’ve been spying on you.” It’s funny at first — then it
            gets under your skin. What if someone really did hijack your
            devices? What if your most private moments became public?
          </p>
          <p>
            The film became a satire of modern fear: losing control of our
            privacy, our devices, and ourselves. The humor cuts through the
            dread — technology as a weapon, shame as leverage, and the question
            of whether we can laugh at the things that terrify us.
          </p>
          <p>
            The threats are real. Sextortion scams, spyware, and connected
            devices that can be hijacked without consent. These aren’t
            hypotheticals — they’re happening now. Crak Hack is a warning, but
            it’s also a release valve. Sometimes the only way to survive the
            panic is to laugh at it.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
