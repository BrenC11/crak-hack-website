export default function ScreenerLogin({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  const hasError = searchParams?.error === "1";
  const next = searchParams?.next ?? "/screener";

  return (
    <main className="ambient-still min-h-screen text-ice">
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
        <div className="glass-border relative z-10 w-full max-w-md rounded-2xl bg-black/70 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
            Screener Access
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-[0.2em] text-ice">
            CRAK HACK
          </h1>
          <p className="mt-4 text-sm text-ice/60">
            Enter the access key to proceed.
          </p>
          <form
            action="/screener/auth"
            method="POST"
            className="mt-6 flex flex-col gap-4"
          >
            <input type="hidden" name="next" value={next} />
            <input
              name="password"
              type="password"
              required
              placeholder="Access key"
              className="w-full rounded-lg border border-hud/30 bg-black/50 px-4 py-3 text-sm text-ice placeholder:text-ice/40 focus:border-hud/70 focus:outline-none"
            />
            {hasError && (
              <p className="text-xs uppercase tracking-[0.2em] text-hack/80">
                Invalid access key
              </p>
            )}
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-hud/40 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/70 hover:text-ice"
            >
              Unlock
              <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

