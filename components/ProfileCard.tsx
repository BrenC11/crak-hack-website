"use client";

import { motion } from "framer-motion";

type ProfileCardProps = {
  name: string;
  role: string;
  bio: string;
  image?: string;
};

export default function ProfileCard({
  name,
  role,
  bio,
  image
}: ProfileCardProps) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-hud/20 bg-black/70 p-6 shadow-glow"
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute right-6 top-6 h-px w-16 bg-hud/50" />
        <div className="absolute left-6 bottom-6 h-px w-20 bg-hack/40 shadow-hackGlow" />
      </div>
      <div className="relative z-10 flex flex-col gap-5">
        <div className="relative h-40 w-full overflow-hidden rounded-xl border border-hud/20 bg-black/60">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-black/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
            {role}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[0.08em] text-ice">
            {name}
          </h3>
          <p className="mt-3 text-sm text-ice/60">{bio}</p>
        </div>
      </div>
    </motion.article>
  );
}
