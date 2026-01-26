export const metadata = {
  title: "CRAK HACK Screener",
  description: "Private screener for CRAK HACK"
};

export default function ScreenerPage() {
  return (
    <main className="min-h-screen bg-void-grid text-ice">
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
                className="h-full w-full"
                src="https://www.youtube.com/embed/RHKxP2qVM6c"
                title="CRAK HACK Screener"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          <div className="text-xs uppercase tracking-[0.3em] text-ice/40">
            Do not share this link.
          </div>
        </div>
      </div>
    </main>
  );
}
