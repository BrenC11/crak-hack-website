import type { Metadata } from "next";

import posterImage from "@/images/Crak Hack Poster - 26 SMALL.jpg";

export const metadata: Metadata = {
  title: "CRAK HACK Screener",
  description: "Private screener for CRAK HACK",
  openGraph: {
    title: "CRAK HACK Screener",
    description: "Private screener for CRAK HACK",
    type: "website",
    images: [
      {
        url: posterImage.src,
        width: posterImage.width,
        height: posterImage.height,
        alt: "CRAK HACK film poster"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CRAK HACK Screener",
    description: "Private screener for CRAK HACK",
    images: [posterImage.src]
  }
};

export default function ScreenerPage() {
  return (
    <main className="min-h-screen ambient-still text-ice">
      <div className="relative min-h-screen px-6 py-20">
        <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
              Private Screener
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[0.18em] text-ice sm:text-5xl">
              CRAK HACK
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-ice/70">
              Access locked. Playback authorized. The visor remembers.
            </p>
          </div>

          <div className="glass-border stream-frame relative overflow-hidden rounded-2xl bg-black/70 p-6 shadow-glow">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute inset-x-0 top-0 h-px bg-hud/40" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-hud/30" />
              <div className="absolute right-10 top-10 h-px w-20 bg-hack/60 shadow-hackGlow" />
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                title="CRAK HACK Screener"
                src="https://www.youtube.com/embed/fFvuAAQw5b4"
                className="absolute inset-0 h-full w-full"
                style={{ width: "100%" }}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-ice/40 sm:flex-row sm:items-center sm:justify-between">
            <span>Do not share this link.</span>
            <a
              href="https://youtu.be/fFvuAAQw5b4"
              target="_blank"
              rel="noreferrer"
              className="text-ice/60 transition duration-300 hover:text-ice"
            >
              Open on YouTube
            </a>
          </div>
          <div>
            <a
              href="/about"
              className="inline-flex items-center gap-3 rounded-full border border-hud/30 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/60 hover:text-ice"
            >
              About
              <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
