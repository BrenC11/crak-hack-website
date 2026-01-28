import { getScreenerAnalytics, type AnalyticsTarget } from "@/lib/cloudflareAnalytics";
import { StatsCharts } from "@/components/StatsCharts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

type SummaryItem = {
  label: string;
  value: number;
};

function aggregateVisitsByDay(
  rows: Array<{
    dimensions: Record<string, string>;
    sum: { visits: number };
    count: number;
  }>,
  timeKey: "datetimeHour" | "datetimeMinute"
) {
  const byDay = new Map<string, { visits: number; views: number }>();
  for (const row of rows) {
    const ts = row.dimensions[timeKey] ?? "";
    const day = ts.slice(0, 10) || "Unknown";
    const prev = byDay.get(day) ?? { visits: 0, views: 0 };
    prev.visits += row.sum?.visits ?? 0;
    prev.views += row.count ?? 0;
    byDay.set(day, prev);
  }
  return Array.from(byDay.entries())
    .map(([day, v]) => ({ day, visits: v.visits, views: v.views }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

function renderTable(
  rows: Array<{ name: string; visits: number; requests: number }>,
  emptyLabel: string
) {
  if (!rows.length) {
    return <p className="text-sm text-ice/60">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-3 text-sm text-ice/70">
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center justify-between border-b border-hud/10 pb-3"
        >
          <span>{row.name}</span>
          <span>{formatNumber(row.visits)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function StatsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const selected =
    (typeof searchParams?.site === "string" ? searchParams.site : undefined) ??
    "screener";
  const target: AnalyticsTarget = selected === "main" ? "main" : "screener";

  let data: Awaited<ReturnType<typeof getScreenerAnalytics>> | null = null;
  let error: string | null = null;

  try {
    data = await getScreenerAnalytics(target);
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Unable to load analytics data.";
  }

  const summary: SummaryItem[] = data
    ? [
        { label: "Visits (24h)", value: data.totals24h.visits },
        { label: "Page Views (24h)", value: data.totals24h.requests },
        { label: "Visits (7d)", value: data.totals7d.visits }
      ]
    : [];

  const timeKey: "datetimeHour" | "datetimeMinute" =
    data?.meta?.timeDimension === "datetimeMinute" ? "datetimeMinute" : "datetimeHour";

  const visits24h = (data?.visits24h ?? [])
    .slice()
    .sort((a, b) => ((a.dimensions[timeKey] ?? "") < (b.dimensions[timeKey] ?? "") ? -1 : 1));

  const visits7dDaily = aggregateVisitsByDay(data?.visits7d ?? [], timeKey);

  const countries =
    data?.countries?.map((row) => ({
      name: row.dimensions.clientCountryName ?? "Unknown",
      visits: row.sum.visits,
      requests: row.count
    })).sort((a, b) => b.visits - a.visits) ?? [];

  const cities =
    data?.cities?.map((row) => ({
      name: row.dimensions.clientCityName ?? "Unknown",
      visits: row.sum.visits,
      requests: row.count
    })).sort((a, b) => b.visits - a.visits) ?? [];

  const browsers =
    data?.browsers?.map((row) => ({
      name: row.dimensions.clientBrowserName ?? "Unknown",
      visits: row.sum.visits,
      requests: row.count
    })).sort((a, b) => b.visits - a.visits) ?? [];

  const operatingSystems =
    data?.operatingSystems?.map((row) => ({
      name: row.dimensions.clientOSName ?? "Unknown",
      visits: row.sum.visits,
      requests: row.count
    })).sort((a, b) => b.visits - a.visits) ?? [];

  const chart24h = visits24h.slice(-48).map((row) => {
    const key = row.dimensions[timeKey] ?? "unknown";
    const label = key.includes("T") ? key.slice(11, 16) : key;
    return {
      key,
      label,
      visits: row.sum.visits,
      views: row.count
    };
  });

  const chart7d = visits7dDaily.slice(-14).map((row) => ({
    day: row.day,
    visits: row.visits,
    views: row.views
  }));

  return (
    <main className="ambient-still min-h-screen text-ice">
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
            Private Telemetry
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.2em] text-ice sm:text-5xl">
            {target === "main" ? "SITE SIGNALS" : "SCREENER SIGNALS"}
          </h1>
          <div className="mt-6 h-px w-40 bg-hud/40 shadow-glow" />
          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em]">
            <a
              href="/crakhackstats666?site=main"
              className={[
                "rounded-full border px-4 py-2 transition duration-300",
                target === "main"
                  ? "border-hud/60 bg-black/60 text-ice"
                  : "border-hud/25 bg-black/20 text-ice/60 hover:border-hud/50 hover:text-ice"
              ].join(" ")}
            >
              Main site
            </a>
            <a
              href="/crakhackstats666?site=screener"
              className={[
                "rounded-full border px-4 py-2 transition duration-300",
                target === "screener"
                  ? "border-hud/60 bg-black/60 text-ice"
                  : "border-hud/25 bg-black/20 text-ice/60 hover:border-hud/50 hover:text-ice"
              ].join(" ")}
            >
              Screener
            </a>
          </div>
          {data && (
            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-ice/50">
                Range 24h / 7d
              </p>
              {data.meta?.selectedDimensions && (
                <p className="text-[11px] uppercase tracking-[0.22em] text-ice/40">
                  Breakdowns:{" "}
                  {data.meta.selectedDimensions.country ? "Countries" : "Countries (n/a)"} ·{" "}
                  {data.meta.selectedDimensions.city ? "Cities" : "Cities (n/a)"} ·{" "}
                  {data.meta.selectedDimensions.browser ? "Browser" : "Browser (n/a)"} ·{" "}
                  {data.meta.selectedDimensions.os ? "OS" : "OS (n/a)"}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="relative bg-void/95 px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {summary.map((card) => (
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
                  {formatNumber(card.value)}
                </p>
              </div>
            </div>
          ))}
          {error && (
            <div className="glass-border rounded-2xl bg-black/70 p-6 text-sm text-ice/70">
              {error}
            </div>
          )}
        </div>

        <StatsCharts points24h={chart24h} points7d={chart7d} />

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Visits Over Time (24h)
            </p>
            <div className="mt-6 space-y-3 text-xs text-ice/70">
              {!visits24h.length && (
                <p className="text-sm text-ice/60">No data yet.</p>
              )}
              {visits24h.slice(-24).map((row) => (
                <div
                  key={row.dimensions[timeKey] ?? "unknown"}
                  className="flex items-center justify-between border-b border-hud/10 pb-2"
                >
                  <span>{row.dimensions[timeKey] ?? "Unknown"}</span>
                  <span>{formatNumber(row.sum.visits)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Visits Over Time (7d)
            </p>
            <div className="mt-6 space-y-3 text-xs text-ice/70">
              {!visits7dDaily.length && (
                <p className="text-sm text-ice/60">No data yet.</p>
              )}
              {visits7dDaily.slice(-14).map((row) => (
                <div
                  key={row.day}
                  className="flex items-center justify-between border-b border-hud/10 pb-2"
                >
                  <span>{row.day}</span>
                  <span>{formatNumber(row.visits)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Countries (7d)
            </p>
            <div className="mt-6">
              {renderTable(countries, "No geo data yet.")}
            </div>
          </div>
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Cities (7d)
            </p>
            <div className="mt-6">
              {renderTable(cities, "City data unavailable.")}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              Browser (7d)
            </p>
            <div className="mt-6">
              {renderTable(browsers, "No browser data yet.")}
            </div>
          </div>
          <div className="glass-border rounded-2xl bg-black/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
              OS (7d)
            </p>
            <div className="mt-6">
              {renderTable(operatingSystems, "No OS data yet.")}
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
