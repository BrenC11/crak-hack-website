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
          sum {
            visits
            requests
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
          sum {
            visits
            requests
          }
        }
        # Visits over time: last 24h (hourly)
        visits24h: httpRequestsAdaptiveGroups(
          limit: 200
          orderBy: [datetimeHour_ASC]
          groupBy: [datetimeHour]
          filter: {
            datetime_geq: $start24h
            datetime_leq: $end24h
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            datetimeHour
          }
          sum {
            visits
            requests
          }
        }
        # Visits over time: last 7d (daily)
        visits7d: httpRequestsAdaptiveGroups(
          limit: 200
          orderBy: [datetimeDay_ASC]
          groupBy: [datetimeDay]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            datetimeDay
          }
          sum {
            visits
            requests
          }
        }
        # Countries
        countries: httpRequestsAdaptiveGroups(
          limit: 50
          orderBy: [sum_visits_DESC]
          groupBy: [clientCountryName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientCountryName
          }
          sum {
            visits
            requests
          }
        }
        # Cities (if available)
        cities: httpRequestsAdaptiveGroups(
          limit: 50
          orderBy: [sum_visits_DESC]
          groupBy: [clientCityName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientCityName
          }
          sum {
            visits
            requests
          }
        }
        # Browser breakdown
        browsers: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [sum_visits_DESC]
          groupBy: [clientBrowserName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientBrowserName
          }
          sum {
            visits
            requests
          }
        }
        # OS breakdown
        operatingSystems: httpRequestsAdaptiveGroups(
          limit: 20
          orderBy: [sum_visits_DESC]
          groupBy: [clientOSName]
          filter: {
            datetime_geq: $start7d
            datetime_leq: $end7d
            clientRequestHTTPHost: $host
          }
        ) {
          dimensions {
            clientOSName
          }
          sum {
            visits
            requests
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
        totals24h?: Array<{ sum: { visits: number; requests: number } }>;
        totals7d?: Array<{ sum: { visits: number; requests: number } }>;
        visits24h?: Array<{
          dimensions: { datetimeHour: string };
          sum: { visits: number; requests: number };
        }>;
        visits7d?: Array<{
          dimensions: { datetimeDay: string };
          sum: { visits: number; requests: number };
        }>;
        countries?: Array<{
          dimensions: { clientCountryName?: string };
          sum: { visits: number; requests: number };
        }>;
        cities?: Array<{
          dimensions: { clientCityName?: string };
          sum: { visits: number; requests: number };
        }>;
        browsers?: Array<{
          dimensions: { clientBrowserName?: string };
          sum: { visits: number; requests: number };
        }>;
        operatingSystems?: Array<{
          dimensions: { clientOSName?: string };
          sum: { visits: number; requests: number };
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
  return {
    range: {
      start24h,
      end24h: end,
      start7d,
      end7d: end
    },
    totals24h: zone?.totals24h?.[0]?.sum ?? { visits: 0, requests: 0 },
    totals7d: zone?.totals7d?.[0]?.sum ?? { visits: 0, requests: 0 },
    visits24h: zone?.visits24h ?? [],
    visits7d: zone?.visits7d ?? [],
    countries: zone?.countries ?? [],
    cities: zone?.cities ?? [],
    browsers: zone?.browsers ?? [],
    operatingSystems: zone?.operatingSystems ?? []
  };
}
