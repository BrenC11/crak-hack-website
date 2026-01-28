import "server-only";

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

export const CF_ANALYTICS_QUERY = `
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
        # Totals for last 24 hours
        totals24h: httpRequestsAdaptiveGroups(
          limit: 1
          filter: {
            datetime_geq: $start24h
            datetime_leq: $end24h
            clientRequestHTTPHost: $host
          }
        ) {
          count
          sum {
            visits
          }
        }
        # Totals for last 7 days
        totals7d: httpRequestsAdaptiveGroups(
          limit: 1
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          count
          sum {
            visits
          }
        }
        # Visits over time: last 24h (hourly)
        visits24h: httpRequestsAdaptiveGroups(
          limit: 200
          orderBy: [datetimeHour_ASC]
          dimensions: [datetimeHour]
          filter: {
            datetime_geq: $start24h
            datetime_leq: $end24h
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            datetimeHour
          }
          count
          sum {
            visits
          }
        }
        # Visits over time: last 7d (daily)
        visits7d: httpRequestsAdaptiveGroups(
          limit: 200
          orderBy: [datetimeDay_ASC]
          dimensions: [datetimeDay]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            datetimeDay
          }
          count
          sum {
            visits
          }
        }
        # Countries
        countries: httpRequestsAdaptiveGroups(
          limit: 50
          orderBy: [sum_visits_DESC]
          dimensions: [clientCountryName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientCountryName
          }
          count
          sum {
            visits
          }
        }
        # Cities (if available)
        cities: httpRequestsAdaptiveGroups(
          limit: 50
          orderBy: [sum_visits_DESC]
          dimensions: [clientCityName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientCityName
          }
          count
          sum {
            visits
          }
        }
        # Browser breakdown
        browsers: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [sum_visits_DESC]
          dimensions: [clientBrowserName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientBrowserName
          }
          count
          sum {
            visits
          }
        }
        # OS breakdown
        operatingSystems: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [sum_visits_DESC]
          dimensions: [clientOSName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientOSName
          }
          count
          sum {
            visits
          }
        }
      }
    }
  }
`;

type CloudflareAnalyticsResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        totals24h?: Array<{ count: number; sum: { visits: number } }>;
        totals7d?: Array<{ count: number; sum: { visits: number } }>;
        visits24h?: Array<{
          dimensions: { datetimeHour: string };
          count: number;
          sum: { visits: number };
        }>;
        visits7d?: Array<{
          dimensions: { datetimeDay: string };
          count: number;
          sum: { visits: number };
        }>;
        countries?: Array<{
          dimensions: { clientCountryName?: string };
          count: number;
          sum: { visits: number };
        }>;
        cities?: Array<{
          dimensions: { clientCityName?: string };
          count: number;
          sum: { visits: number };
        }>;
        browsers?: Array<{
          dimensions: { clientBrowserName?: string };
          count: number;
          sum: { visits: number };
        }>;
        operatingSystems?: Array<{
          dimensions: { clientOSName?: string };
          count: number;
          sum: { visits: number };
        }>;
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

export async function getScreenerAnalytics() {
  const token = getEnv("CLOUDFLARE_API_TOKEN");
  const zoneId = getEnv("CLOUDFLARE_ZONE_ID");
  const host = getEnv("CLOUDFLARE_HOSTNAME");

  const end = new Date().toISOString();
  const start24h = isoDaysAgo(1);
  const start7d = isoDaysAgo(7);

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: CF_ANALYTICS_QUERY,
      variables: {
        zoneId,
        host,
        start24h,
        end24h: end,
        start7d,
        end7d: end
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status}`);
  }

  const payload = (await response.json()) as CloudflareAnalyticsResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "Cloudflare API error");
  }

  const zone = payload.data?.viewer?.zones?.[0];
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
    cities: zone?.cities ?? [],
    browsers: zone?.browsers ?? [],
    operatingSystems: zone?.operatingSystems ?? []
  };
}
