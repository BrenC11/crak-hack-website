"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type StatsResponse = {
  range: { start: string; end: string; days: number };
  totals: { requests: number; getRequests: number; putRequests: number };
  byAction: Array<{
    dimensions: { actionType: string; actionStatus: string };
    sum: { requests: number };
  }>;
  storage: {
    objectCount?: number;
    uploadCount?: number;
    payloadSize?: number;
    metadataSize?: number;
  } | null;
  topCountries: Array<{
    dimensions: { clientCountryName?: string };
    sum: { requests: number };
  }>;
  error?: string;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

const formatBytes = (value?: number) => {
  if (!value && value !== 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(1)} ${units[index]}`;
};

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/r2-stats?days=${days}`)
      .then((res) => res.json())
      .then((data: StatsResponse) => {
        if (active) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setStats({ error: "Unable to load stats." } as StatsResponse);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [days]);

  const totalViews = stats?.totals?.getRequests ?? 0;
  const totalRequests = stats?.totals?.requests ?? 0;
  const totalUploads = stats?.totals?.putRequests ?? 0;

  const topCountries = useMemo(() => {
    if (!stats?.topCountries?.length) return [];
    return stats.topCountries.slice(0, 8);
  }, [stats]);

  return (
    <main className="ambient-still min-h-screen text-ice">
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="relative z-10 mx-auto max-w-6xl"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
            Private Telemetry
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.2em] text-ice sm:text-5xl">
            SCREENER SIGNALS
          </h1>
          <div className="mt-6 h-px w-40 bg-hud/40 shadow-glow" />
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.25em] text-ice/50">
            <span>Range</span>
            <button
              type="button"
              onClick={() => setDays(7)}
              className={`rounded-full border px-4 py-2 transition ${
                days === 7
                  ? "border-hud/70 text-ice"
                  : "border-hud/30 text-ice/60 hover:border-hud/60"
              }`}
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => setDays(14)}
              className={`rounded-full border px-4 py-2 transition ${
                days === 14
                  ? "border-hud/70 text-ice"
                  : "border-hud/30 text-ice/60 hover:border-hud/60"
              }`}
            >
              14d
            </button>
            <button
              type="button"
              onClick={() => setDays(30)}
              className={`rounded-full border px-4 py-2 transition ${
                days === 30
                  ? "border-hud/70 text-ice"
                  : "border-hud/30 text-ice/60 hover:border-hud/60"
              }`}
            >
              30d
            </button>
          </div>
        </motion.div>
      </section>

      <section className="relative bg-void/95 px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            { label: "Views", value: totalViews },
            { label: "Total Requests", value: totalRequests },
            { label: "Uploads", value: totalUploads }
          ].map((card) => (
            <div
              key={card.label}
              className="glass-border relative overflow-hidden rounded-2xl bg-black/70 p-6"
            >
              <div className="absolute inset-0 opacity-20">
                <div className="absolute right-6 top-6 h-px w-16 bg-hud/50" />
                <div className="absolute left-6 bottom-6 h-px w-20 bg-hack/40 shadow-hackGlow" />
              </div>
              <div className="relative">
                <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
                  {card.label}
                </p>
                <p className="mt-4 text-3xl font-semibold text-ice">
                  {loading ? "…" : formatNumber(card.value)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Storage Snapshot
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-ice/60">Objects</p>
                <p className="mt-2 text-xl text-ice">
                  {loading
                    ? "…"
                    : formatNumber(stats?.storage?.objectCount ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ice/60">Uploads</p>
                <p className="mt-2 text-xl text-ice">
                  {loading
                    ? "…"
                    : formatNumber(stats?.storage?.uploadCount ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ice/60">Payload Size</p>
                <p className="mt-2 text-xl text-ice">
                  {loading ? "…" : formatBytes(stats?.storage?.payloadSize)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ice/60">Metadata Size</p>
                <p className="mt-2 text-xl text-ice">
                  {loading ? "…" : formatBytes(stats?.storage?.metadataSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Top Locations
            </p>
            <div className="mt-6 space-y-4 text-sm text-ice/70">
              {loading && <p>Loading…</p>}
              {!loading && topCountries.length === 0 && (
                <p>Geo data unavailable. Add CLOUDFLARE_ZONE_ID + HOSTNAME.</p>
              )}
              {!loading &&
                topCountries.map((row) => (
                  <div
                    key={row.dimensions.clientCountryName ?? "unknown"}
                    className="flex items-center justify-between border-b border-hud/10 pb-3"
                  >
                    <span>{row.dimensions.clientCountryName ?? "Unknown"}</span>
                    <span>{formatNumber(row.sum.requests)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-hud/30 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/60 hover:text-ice"
          >
            Main
            <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
          </a>
          <a
            href="/about"
            className="inline-flex items-center gap-3 rounded-full border border-hud/30 bg-black/40 px-6 py-3 text-xs uppercase tracking-[0.3em] text-ice/70 transition duration-300 hover:border-hud/60 hover:text-ice"
          >
            About
            <span className="h-1.5 w-1.5 rounded-full bg-hack/80 shadow-hackGlow" />
          </a>
        </div>
      </section>
    </main>
  );
}
