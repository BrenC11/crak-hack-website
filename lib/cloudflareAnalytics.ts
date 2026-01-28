import "server-only";

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

type IntrospectionTypeFieldsResponse = {
  data?: {
    __type?: {
      name?: string;
      fields?: Array<{ name: string }>;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const DIMENSIONS_TYPE_CANDIDATES = [
  "HttpRequestsAdaptiveGroupDimensions",
  "httpRequestsAdaptiveGroupDimensions",
  "HTTPRequestsAdaptiveGroupDimensions",
  "HttpRequestsAdaptiveGroupDimension",
  "httpRequestsAdaptiveGroupDimension"
] as const;

const TIME_DIMENSION_PREFERENCE = ["datetimeHour", "datetimeMinute"] as const;

let dimensionsFieldSetPromise: Promise<Set<string>> | null = null;

function buildRangeAnalyticsQuery(opts: {
  timeDimension: string;
  includeCountry: boolean;
  includeBrowser: boolean;
  includeOs: boolean;
}) {
  const countryBlock = opts.includeCountry
    ? `
        countries: httpRequestsAdaptiveGroups(
          limit: 50
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { clientCountryName }
          count
          sum { visits }
        }`
    : "";

  const browserBlock = opts.includeBrowser
    ? `
        browsers: httpRequestsAdaptiveGroups(
          limit: 20
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { clientBrowserName }
          count
          sum { visits }
        }`
    : "";

  const osBlock = opts.includeOs
    ? `
        operatingSystems: httpRequestsAdaptiveGroups(
          limit: 20
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { clientOSName }
          count
          sum { visits }
        }`
    : "";

  return `
    query RangeAnalytics(
      $zoneId: String!
      $host: String!
      $start: DateTime!
      $end: DateTime!
    ) {
      viewer {
        zones(filter: { zoneTag: $zoneId }) {
          totals: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: $start
              datetime_leq: $end
              clientRequestHTTPHost: $host
            }
          ) { count sum { visits } }

          visits: httpRequestsAdaptiveGroups(
            limit: 400
            filter: {
              datetime_geq: $start
              datetime_leq: $end
              clientRequestHTTPHost: $host
            }
          ) {
            dimensions { ${opts.timeDimension} }
            count
            sum { visits }
          }
          ${countryBlock}
          ${browserBlock}
          ${osBlock}
        }
      }
    }
  `;
}

type RangeAnalyticsZone = {
  totals?: Array<{ count: number; sum: { visits: number } }>;
  visits?: Array<{
    dimensions: Record<string, string>;
    count: number;
    sum: { visits: number };
  }>;
  countries?: Array<{
    dimensions: { clientCountryName?: string };
    count: number;
    sum: { visits: number };
  }>;
  browsers?: Array<{
    dimensions: Record<string, string>;
    count: number;
    sum: { visits: number };
  }>;
  operatingSystems?: Array<{
    dimensions: Record<string, string>;
    count: number;
    sum: { visits: number };
  }>;
};

type CloudflareAnalyticsResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        totals?: Array<{ count: number; sum: { visits: number } }>;
        visits?: Array<{
          dimensions: Record<string, string>;
          count: number;
          sum: { visits: number };
        }>;
        countries?: RangeAnalyticsZone["countries"];
        browsers?: RangeAnalyticsZone["browsers"];
        operatingSystems?: RangeAnalyticsZone["operatingSystems"];
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function isoDaysAgo(days: number) {
  const now = new Date();
  const then = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return then.toISOString();
}

async function fetchAnalytics(
  token: string,
  query: string,
  variables: Record<string, unknown>
) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status}`);
  }

  const payload = (await response.json()) as CloudflareAnalyticsResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Cloudflare API error");
  }
  return payload;
}

async function fetchDimensionsFieldSet(token: string) {
  const introspectionQuery = `
    query TypeFields($name: String!) {
      __type(name: $name) {
        name
        fields { name }
      }
    }
  `;

  for (const typeName of DIMENSIONS_TYPE_CANDIDATES) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: introspectionQuery,
        variables: { name: typeName }
      }),
      cache: "no-store"
    });

    if (!response.ok) continue;
    const payload = (await response.json()) as IntrospectionTypeFieldsResponse;
    if (payload.errors?.length) continue;
    const fields = payload.data?.__type?.fields;
    if (fields?.length) {
      return new Set(fields.map((f) => f.name));
    }
  }

  // If introspection is blocked or the type name changes, fall back to a conservative set.
  return new Set<string>(["datetimeHour", "datetimeMinute"]);
}

async function getDimensionsFieldSet(token: string) {
  if (!dimensionsFieldSetPromise) {
    dimensionsFieldSetPromise = fetchDimensionsFieldSet(token);
  }
  return dimensionsFieldSetPromise;
}

export async function getScreenerAnalytics() {
  const token = getEnv("CLOUDFLARE_API_TOKEN");
  const zoneId = getEnv("CLOUDFLARE_ZONE_ID");
  const host = getEnv("CLOUDFLARE_HOSTNAME");

  const dims = await getDimensionsFieldSet(token);
  const timeDimension =
    TIME_DIMENSION_PREFERENCE.find((d) => dims.has(d)) ?? "datetimeHour";

  const includeCountry = dims.has("clientCountryName");
  const includeBrowser = dims.has("clientBrowserName");
  const includeOs = dims.has("clientOSName");

  const query = buildRangeAnalyticsQuery({
    timeDimension,
    includeCountry,
    includeBrowser,
    includeOs
  });

  const endDate = new Date();
  const end = endDate.toISOString();
  const start24h = isoDaysAgo(1);
  const start7d = isoDaysAgo(7);

  // 24h fetch (single request)
  const payload24h = await fetchAnalytics(token, query, {
    zoneId,
    host,
    start: start24h,
    end
  });
  const zone24h = (payload24h?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
  const totals24h = zone24h.totals?.[0];

  // 7d fetch must be chunked into <= 86400s windows per Cloudflare limits.
  const start7dDate = new Date(start7d);
  const ranges: Array<{ start: string; end: string }> = [];
  let cursor = start7dDate;
  while (cursor.getTime() < endDate.getTime()) {
    const next = new Date(Math.min(endDate.getTime(), cursor.getTime() + 24 * 60 * 60 * 1000));
    ranges.push({ start: cursor.toISOString(), end: next.toISOString() });
    cursor = next;
  }

  const payloads7d = await Promise.all(
    ranges.map((r) =>
      fetchAnalytics(token, query, { zoneId, host, start: r.start, end: r.end })
    )
  );

  const totals7dAgg = payloads7d.reduce(
    (acc, p) => {
      const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
      const t = z.totals?.[0];
      acc.visits += t?.sum?.visits ?? 0;
      acc.requests += t?.count ?? 0;
      return acc;
    },
    { visits: 0, requests: 0 }
  );

  const visits7d = payloads7d.flatMap((p) => {
    const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
    return z.visits ?? [];
  });

  function mergeTopRows(
    rows: Array<{ name: string; visits: number; requests: number }>
  ): Array<{ name: string; visits: number; requests: number }> {
    const map = new Map<string, { visits: number; requests: number }>();
    for (const row of rows) {
      const key = row.name || "Unknown";
      const prev = map.get(key) ?? { visits: 0, requests: 0 };
      prev.visits += row.visits;
      prev.requests += row.requests;
      map.set(key, prev);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, visits: v.visits, requests: v.requests }))
      .sort((a, b) => b.visits - a.visits);
  }

  const countriesMerged = includeCountry
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.countries?.map((row) => ({
              name: row.dimensions.clientCountryName ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 50)
    : [];

  const browsersMerged = includeBrowser
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.browsers?.map((row) => ({
              name: row.dimensions.clientBrowserName ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 20)
    : [];

  const osMerged = includeOs
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.operatingSystems?.map((row) => ({
              name: row.dimensions.clientOSName ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 20)
    : [];

  return {
    range: {
      start24h,
      end24h: end,
      start7d,
      end7d: end
    },
    // Cloudflare GraphQL `httpRequestsAdaptiveGroups` uses `count` for request totals.
    totals24h: {
      visits: totals24h?.sum?.visits ?? 0,
      requests: totals24h?.count ?? 0
    },
    totals7d: {
      visits: totals7dAgg.visits,
      requests: totals7dAgg.requests
    },
    visits24h: zone24h.visits ?? [],
    visits7d,
    countries: countriesMerged.map((row) => ({
      dimensions: { clientCountryName: row.name },
      count: row.requests,
      sum: { visits: row.visits }
    })),
    cities: [],
    browsers: browsersMerged.map((row) => ({
      dimensions: { clientBrowserName: row.name },
      count: row.requests,
      sum: { visits: row.visits }
    })),
    operatingSystems: osMerged.map((row) => ({
      dimensions: { clientOSName: row.name },
      count: row.requests,
      sum: { visits: row.visits }
    })),
    meta: {
      timeDimension,
      supportedDimensions: Array.from(dims),
      chunks: ranges.length
    }
  };
}
