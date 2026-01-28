import "server-only";

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

type IntrospectionTypeFieldsResponse = {
  data?: {
    __type?: {
      name?: string;
      fields?: Array<{
        name: string;
        type?: {
          kind?: string;
          name?: string | null;
          ofType?: any;
        };
      }>;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const TIME_DIMENSION_PREFERENCE = ["datetimeHour", "datetimeMinute"] as const;

let dimensionsFieldSetPromise: Promise<Set<string>> | null = null;

type IntrospectionTypeRef = {
  kind?: string;
  name?: string | null;
  ofType?: IntrospectionTypeRef | null;
};

function unwrapNamedType(typeRef: IntrospectionTypeRef | null | undefined): string | null {
  let current: IntrospectionTypeRef | null | undefined = typeRef;
  for (let i = 0; i < 10; i++) {
    if (!current) return null;
    if (current.name) return current.name;
    current = current.ofType;
  }
  return null;
}

function pickDimension(
  supported: Set<string>,
  candidates: readonly string[]
): string | null {
  for (const name of candidates) {
    if (supported.has(name)) return name;
  }
  return null;
}

function buildRangeAnalyticsQuery(opts: {
  timeDimension: string;
  countryDimension: string | null;
  cityDimension: string | null;
  browserDimension: string | null;
  osDimension: string | null;
}) {
  const countryBlock = opts.countryDimension
    ? `
        countries: httpRequestsAdaptiveGroups(
          limit: 50
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { ${opts.countryDimension} }
          count
          sum { visits }
        }`
    : "";

  const cityBlock = opts.cityDimension
    ? `
        cities: httpRequestsAdaptiveGroups(
          limit: 50
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { ${opts.cityDimension} }
          count
          sum { visits }
        }`
    : "";

  const browserBlock = opts.browserDimension
    ? `
        browsers: httpRequestsAdaptiveGroups(
          limit: 20
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { ${opts.browserDimension} }
          count
          sum { visits }
        }`
    : "";

  const osBlock = opts.osDimension
    ? `
        operatingSystems: httpRequestsAdaptiveGroups(
          limit: 20
          filter: {
            datetime_geq: $start
            datetime_leq: $end
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { ${opts.osDimension} }
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
          ${cityBlock}
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
    dimensions: Record<string, string>;
    count: number;
    sum: { visits: number };
  }>;
  cities?: Array<{
    dimensions: Record<string, string>;
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
        cities?: RangeAnalyticsZone["cities"];
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

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function isoDaysAgo(days: number) {
  const now = new Date();
  const then = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return then.toISOString();
}

function inferMainHostFrom(host: string) {
  const normalized = host.trim().toLowerCase();
  return normalized.startsWith("screener.")
    ? normalized.slice("screener.".length)
    : normalized;
}

export type AnalyticsTarget = "main" | "screener";

function resolveAnalyticsHost(target: AnalyticsTarget) {
  // Backwards compatible: CLOUDFLARE_HOSTNAME historically pointed at the screener host.
  const configured = getEnv("CLOUDFLARE_HOSTNAME");
  const screener =
    getOptionalEnv("CLOUDFLARE_HOSTNAME_SCREENER") ?? configured;
  const main =
    getOptionalEnv("CLOUDFLARE_HOSTNAME_MAIN") ?? inferMainHostFrom(screener);

  if (target === "main") return main;
  // Ensure we end up with a screener.* hostname.
  return screener.startsWith("screener.") ? screener : `screener.${main}`;
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
  const typeQuery = `
    query TypeFields($name: String!) {
      __type(name: $name) {
        name
        fields {
          name
          type {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  async function fetchType(name: string) {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: typeQuery,
        variables: { name }
      }),
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as IntrospectionTypeFieldsResponse;
    if (payload.errors?.length) return null;
    return payload.data?.__type ?? null;
  }

  // Resolve the dimensions type by walking:
  // Zone.httpRequestsAdaptiveGroups -> <group type> -> dimensions -> <dimensions type> -> fields.
  const zoneType = await fetchType("Zone");
  const httpField = zoneType?.fields?.find((f) => f.name === "httpRequestsAdaptiveGroups");
  const groupTypeName = unwrapNamedType(httpField?.type as IntrospectionTypeRef | undefined);
  if (groupTypeName) {
    const groupType = await fetchType(groupTypeName);
    const dimensionsField = groupType?.fields?.find((f) => f.name === "dimensions");
    const dimensionsTypeName = unwrapNamedType(
      dimensionsField?.type as IntrospectionTypeRef | undefined
    );
    if (dimensionsTypeName) {
      const dimensionsType = await fetchType(dimensionsTypeName);
      const fields = dimensionsType?.fields ?? [];
      if (fields.length) {
        return new Set(fields.map((f) => f.name));
      }
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

function buildProbeQuery(field: string) {
  return `
    query ProbeDimension($zoneId: String!, $host: String!, $start: DateTime!, $end: DateTime!) {
      viewer {
        zones(filter: { zoneTag: $zoneId }) {
          probe: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: $start
              datetime_leq: $end
              clientRequestHTTPHost: $host
            }
          ) {
            dimensions { ${field} }
          }
        }
      }
    }
  `;
}

async function probeDimensionField(args: {
  token: string;
  zoneId: string;
  host: string;
  start: string;
  end: string;
  field: string;
}) {
  try {
    await fetchAnalytics(args.token, buildProbeQuery(args.field), {
      zoneId: args.zoneId,
      host: args.host,
      start: args.start,
      end: args.end
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (new RegExp(`unknown field\\s+"?${args.field}"?`, "i").test(message)) {
      return false;
    }
    // If something else went wrong (token, zone, etc.), don't treat it as "unsupported field".
    throw err;
  }
}

async function pickWorkingDimension(args: {
  token: string;
  zoneId: string;
  host: string;
  start: string;
  end: string;
  candidates: readonly string[];
}) {
  for (const field of args.candidates) {
    const ok = await probeDimensionField({ ...args, field });
    if (ok) return field;
  }
  return null;
}

export async function getScreenerAnalytics(target: AnalyticsTarget = "screener") {
  const token = getEnv("CLOUDFLARE_API_TOKEN");
  const zoneId = getEnv("CLOUDFLARE_ZONE_ID");
  const host = resolveAnalyticsHost(target);

  const dims = await getDimensionsFieldSet(token);
  const timeDimension =
    TIME_DIMENSION_PREFERENCE.find((d) => dims.has(d)) ?? "datetimeHour";

  let countryDimension = pickDimension(dims, [
    "clientCountryName",
    "clientCountry",
    "clientCountryCode",
    "clientCountryAlpha2",
    "clientCountryAlpha3"
  ] as const);

  let cityDimension = pickDimension(dims, [
    "clientCityName",
    "clientCity",
    "clientCityCode"
  ] as const);

  let browserDimension = pickDimension(dims, [
    "clientBrowserName",
    "clientBrowserFamily",
    "clientBrowser"
  ] as const);

  let osDimension = pickDimension(dims, [
    "clientOSName",
    "clientOperatingSystem",
    "clientOS"
  ] as const);

  const endDate = new Date();
  const end = endDate.toISOString();
  const start24h = isoDaysAgo(1);
  const start7d = isoDaysAgo(7);

  // If introspection is blocked (common in Cloudflare prod), probe field existence safely.
  if (!countryDimension || !cityDimension || !browserDimension || !osDimension) {
    const [countryProbe, cityProbe, browserProbe, osProbe] = await Promise.all([
      countryDimension
        ? Promise.resolve(countryDimension)
        : pickWorkingDimension({
            token,
            zoneId,
            host,
            start: start24h,
            end,
            candidates: [
              "clientCountryName",
              "clientCountry",
              "clientCountryCode",
              "clientCountryAlpha2",
              "clientCountryAlpha3"
            ]
          }),
      cityDimension
        ? Promise.resolve(cityDimension)
        : pickWorkingDimension({
            token,
            zoneId,
            host,
            start: start24h,
            end,
            candidates: ["clientCityName", "clientCity", "clientCityCode"]
          }),
      browserDimension
        ? Promise.resolve(browserDimension)
        : pickWorkingDimension({
            token,
            zoneId,
            host,
            start: start24h,
            end,
            candidates: ["clientBrowserName", "clientBrowserFamily", "clientBrowser"]
          }),
      osDimension
        ? Promise.resolve(osDimension)
        : pickWorkingDimension({
            token,
            zoneId,
            host,
            start: start24h,
            end,
            candidates: ["clientOSName", "clientOperatingSystem", "clientOS"]
          })
    ]);
    countryDimension = countryProbe;
    cityDimension = cityProbe;
    browserDimension = browserProbe;
    osDimension = osProbe;
  }

  const query = buildRangeAnalyticsQuery({
    timeDimension,
    countryDimension,
    cityDimension,
    browserDimension,
    osDimension
  });

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

  const countriesMerged = countryDimension
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.countries?.map((row) => ({
              name: row.dimensions[countryDimension] ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 50)
    : [];

  const citiesMerged = cityDimension
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.cities?.map((row) => ({
              name: row.dimensions[cityDimension] ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 50)
    : [];

  const browsersMerged = browserDimension
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.browsers?.map((row) => ({
              name: row.dimensions[browserDimension] ?? "Unknown",
              visits: row.sum.visits,
              requests: row.count
            })) ?? []
          );
        })
      ).slice(0, 20)
    : [];

  const osMerged = osDimension
    ? mergeTopRows(
        payloads7d.flatMap((p) => {
          const z = (p?.data?.viewer?.zones?.[0] ?? {}) as RangeAnalyticsZone;
          return (
            z.operatingSystems?.map((row) => ({
              name: row.dimensions[osDimension] ?? "Unknown",
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
    cities: citiesMerged.map((row) => ({
      dimensions: { clientCityName: row.name },
      count: row.requests,
      sum: { visits: row.visits }
    })),
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
      chunks: ranges.length,
      selectedDimensions: {
        country: countryDimension,
        city: cityDimension,
        browser: browserDimension,
        os: osDimension
      },
      target,
      host
    }
  };
}
