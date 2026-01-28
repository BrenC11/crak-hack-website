import { getScreenerAnalytics } from "@/lib/cloudflareAnalytics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-GB").format(value);

type SummaryItem = {
  label: string;
  value: number;
};

function aggregateVisitsByDay(
  rows: Array<{ dimensions: { datetimeHour: string }; sum: { visits: number } }>
) {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const ts = row.dimensions.datetimeHour ?? "";
    const day = ts.slice(0, 10) || "Unknown";
    byDay.set(day, (byDay.get(day) ?? 0) + (row.sum?.visits ?? 0));
  }
  return Array.from(byDay.entries())
    .map(([day, visits]) => ({ day, visits }))
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

export default async function StatsPage() {
  let data: Awaited<ReturnType<typeof getScreenerAnalytics>> | null = null;
  let error: string | null = null;

  try {
    data = await getScreenerAnalytics();
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

  const visits24h = (data?.visits24h ?? [])
    .slice()
    .sort((a, b) => (a.dimensions.datetimeHour < b.dimensions.datetimeHour ? -1 : 1));

  const visits7dDaily = aggregateVisitsByDay((data?.visits7d ?? []) as Array<{
    dimensions: { datetimeHour: string };
    sum: { visits: number };
  }>);

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

  return (
    <main className="ambient-still min-h-screen text-ice">
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <div className="absolute inset-0 noise-overlay" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.3em] text-hud/70">
            Private Telemetry
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[0.2em] text-ice sm:text-5xl">
            SCREENER SIGNALS
          </h1>
          <div className="mt-6 h-px w-40 bg-hud/40 shadow-glow" />
          {data && (
            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-ice/50">
              Range 24h / 7d
            </p>
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
                  key={row.dimensions.datetimeHour}
                  className="flex items-center justify-between border-b border-hud/10 pb-2"
                >
                  <span>{row.dimensions.datetimeHour}</span>
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
