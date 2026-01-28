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

function buildScreenerAnalyticsQuery(opts: {
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
            datetime_geq: $start7d
            datetime_leq: $end7d
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
            datetime_geq: $start7d
            datetime_leq: $end7d
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
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions { clientOSName }
          count
          sum { visits }
        }`
    : "";

  return `
    query ScreenerAnalytics(
      $zoneId: String!
      $host: String!
      $start24h: DateTime!
      $end24h: DateTime!
      $start7d: DateTime!
      $end7d: DateTime!
    ) {
      viewer {
        zones(filter: { zoneTag: $zoneId }) {
          totals24h: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: $start24h
              datetime_leq: $end24h
              clientRequestHTTPHost: $host
            }
          ) { count sum { visits } }

          totals7d: httpRequestsAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: $start7d
              datetime_leq: $end7d
              clientRequestHTTPHost: $host
            }
          ) { count sum { visits } }

          visits24h: httpRequestsAdaptiveGroups(
            limit: 400
            filter: {
              datetime_geq: $start24h
              datetime_leq: $end24h
              clientRequestHTTPHost: $host
            }
          ) {
            dimensions { ${opts.timeDimension} }
            count
            sum { visits }
          }

          visits7d: httpRequestsAdaptiveGroups(
            limit: 3000
            filter: {
              datetime_geq: $start7d
              datetime_leq: $end7d
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

type CloudflareAnalyticsResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        totals24h?: Array<{ count: number; sum: { visits: number } }>;
        totals7d?: Array<{ count: number; sum: { visits: number } }>;
        visits24h?: Array<{
          dimensions: Record<string, string>;
          count: number;
          sum: { visits: number };
        }>;
        visits7d?: Array<{
          dimensions: Record<string, string>;
          count: number;
          sum: { visits: number };
        }>;
        countries?: Array<{
          dimensions: { clientCountryName?: string };
          count: number;
          sum: { visits: number };
        }>;
        browsers?: Array<{ dimensions: Record<string, string>; count: number; sum: { visits: number } }>;
        operatingSystems?: Array<{ dimensions: Record<string, string>; count: number; sum: { visits: number } }>;
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

  const end = new Date().toISOString();
  const start24h = isoDaysAgo(1);
  const start7d = isoDaysAgo(7);

  const variables = {
    zoneId,
    host,
    start24h,
    end24h: end,
    start7d,
    end7d: end
  };

  const dims = await getDimensionsFieldSet(token);
  const timeDimension =
    TIME_DIMENSION_PREFERENCE.find((d) => dims.has(d)) ?? "datetimeHour";

  const includeCountry = dims.has("clientCountryName");
  const includeBrowser = dims.has("clientBrowserName");
  const includeOs = dims.has("clientOSName");

  const query = buildScreenerAnalyticsQuery({
    timeDimension,
    includeCountry,
    includeBrowser,
    includeOs
  });

  const payload = await fetchAnalytics(token, query, variables);

  const zone = payload?.data?.viewer?.zones?.[0];
  const totals24h = zone?.totals24h?.[0];
  const totals7d = zone?.totals7d?.[0];
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
      visits: totals7d?.sum?.visits ?? 0,
      requests: totals7d?.count ?? 0
    },
    visits24h: zone?.visits24h ?? [],
    visits7d: zone?.visits7d ?? [],
    countries: zone?.countries ?? [],
    cities: [],
    browsers: zone?.browsers ?? [],
    operatingSystems: zone?.operatingSystems ?? [],
    meta: {
      timeDimension,
      supportedDimensions: Array.from(dims)
    }
  };
}
