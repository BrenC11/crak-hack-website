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
    bio: "A London-based cinematographer working across narrative, documentary, and commercial projects, with a strong focus on visual storytelling and emotional impact. His debut feature Retreat is currently on the 2024 festival circuit, following successful runs for his short films 7-10, Tap Boy, and Aria. His promo People Let’s Dance for Public Service Broadcasting was nominated for an MVA. He is a member of BAFTA Crew and was recently featured in British Cinematography’s “Meet the New Wave”.",
    image: "/howard-mills.png"
  },
  {
    name: "Ryan McCarthy",
    role: "Art Director",
    bio: "Trained in Architecture (BA, 2013) and Critical Design (MA, 2015), with a strong focus on experiential design and the emotional journey through space. Since 2015, he has worked across commercials and television, progressing from Art Department Assistant to Set Designer and Art Director on projects for brands including Virgin Media, Magnum, and Pizza Express, and networks such as Netflix, Syfy, and ITV. His work is driven by a belief in growth, craft, and shaping meaningful spatial narratives for contemporary audiences.",
    image: "/ryan-mccarthy.png"
  },
  {
    name: "Johnny Vivash",
    role: "Lead Actor",
    bio: "Bio coming soon.",
    image: "/johnny-vivash.png"
  },
  {
    name: "Amanda Lara Kay",
    role: "Lead Actress",
    bio: "Profile loading…",
    image: "/amanda-lara-kay.png"
  },
  {
    name: "Sanj Surati",
    role: "Lead Support",
    bio: "London-born stand-up comedian, improviser, and actor known for his sharp wit and commanding screen presence. Trained in theatre under John Buckingham, he began his career as a rock musician before moving into acting. He has worked with directors including Sam Raimi, Stephen Frears, Guy Ritchie, and Chloé Zhao, and appeared alongside Pierce Brosnan, Elizabeth Olsen, and Freya Allan. A regular international improv performer, he is currently appearing in London’s West End in the award-winning Japanese improvisation show Batsu! and is a trustee of the English Touring Theatre.",
    image: "/sanj-surati.png"
  },
  {
    name: "Jon Draper",
    role: "VFX Artist",
    bio: "Founder of Stormy Studio and AIAnimation.com, with 20+ years’ experience in animation and creative production. After building Stormy Studio into an award-winning animation company delivering hundreds of projects for UK SMEs, FTSE 100 firms, and global brands, he is now focused on the future of animation. Through AIAnimation.com, he is developing an AI-powered platform enabling creators and brands to generate images, 3D models, animation, and video from a single, unified workflow, with growing adoption across the animation and advertising industries.",
    image: "/jon-draper.png"
  },
  {
    name: "Joe Holweger",
    role: "Music Composer",
    bio: "Joe Holweger is a composer and actor from London. He has scored a number of short films in recent years, having come from a background as a touring professional musician, including working as a touring musician with Adam Ant. He has also written songs for many well-known pop artists, and composed music for various TV shows, documentaries, and advertisements.",
    image: "/joe-holweger.png"
  }
];

export default function ProfileGrid() {
  return (
    <section className="relative bg-void/95 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
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
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {profiles.map((profile) => (
            <ProfileCard key={profile.name} {...profile} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
