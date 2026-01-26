"use client";

import { motion } from "framer-motion";
import ProfileCard from "@/components/ProfileCard";

const profiles = [
  {
    name: "Brendan Cleaves",
    role: "Writer / Director",
    bio: "Profile loading…",
    image: "/brendan-cleaves.png"
  },
  {
    name: "Howard Mills",
    role: "Director of Photography",
    bio: "Bio coming soon."
  },
  {
    name: "Ryan McCarthy",
    role: "Art Director",
    bio: "Profile loading…"
  },
  {
    name: "Johnny Vivash",
    role: "Lead Actor",
    bio: "Bio coming soon."
  },
  {
    name: "Sanj Surati",
    role: "Lead Support",
    bio: "Profile loading…"
  }
];

export default function ProfileGrid() {
  return (
    <section className="relative bg-void/95 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mx-auto max-w-6xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
              CAST & CREW
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[0.12em] text-ice">
              Identity Records
            </h2>
          </div>
          <div className="hidden h-px w-40 bg-hud/30 sm:block" />
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.name} {...profile} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
