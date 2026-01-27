import { NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

type R2OperationRow = {
  dimensions: {
    actionType: string;
    actionStatus: string;
  };
  sum: {
    requests: number;
  };
};

type R2StorageRow = {
  max: {
    objectCount?: number;
    uploadCount?: number;
    payloadSize?: number;
    metadataSize?: number;
  };
};

type CountryRow = {
  dimensions: {
    clientCountryName?: string;
  };
  sum: {
    requests: number;
  };
};

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

function clampDays(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 7;
  return Math.min(90, Math.max(1, Math.floor(value)));
}

export async function GET(request: Request) {
  const token = getEnv("CLOUDFLARE_API_TOKEN");
  const accountId = getEnv("CLOUDFLARE_ACCOUNT_ID");
  const bucketName = getEnv("R2_BUCKET_NAME");
  const zoneId = getEnv("CLOUDFLARE_ZONE_ID");
  const hostname = getEnv("CLOUDFLARE_HOSTNAME");

  if (!token || !accountId || !bucketName) {
    return NextResponse.json(
      {
        error:
          "Missing env vars. Required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME."
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const days = clampDays(Number(url.searchParams.get("days") ?? 7));
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const includeGeo = Boolean(zoneId && hostname);

  const query = `
    query R2Stats($accountId: String!, $bucketName: String!, $start: DateTime!, $end: DateTime!, $zoneId: String, $hostname: String) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          r2OperationsAdaptiveGroups(
            limit: 1000
            filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }
          ) {
            dimensions { actionType actionStatus }
            sum { requests }
          }
          r2StorageAdaptiveGroups(
            limit: 1
            filter: { datetime_geq: $start, datetime_leq: $end, bucketName: $bucketName }
            orderBy: [datetime_DESC]
          ) {
            max { objectCount uploadCount payloadSize metadataSize }
          }
        }
        ${includeGeo ? "zones(filter: { zoneTag: $zoneId }) {" : ""}
        ${includeGeo ? `
          httpRequestsAdaptiveGroups(
            limit: 25
            filter: {
              datetime_geq: $start
              datetime_leq: $end
              clientRequestHTTPHost: $hostname
            }
            orderBy: [sum_requests_DESC]
          ) {
            dimensions { clientCountryName }
            sum { requests }
          }
        }` : ""}
        ${includeGeo ? "}" : ""}
      }
    }
  `;

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      variables: {
        accountId,
        bucketName,
        start: startIso,
        end: endIso,
        zoneId: zoneId ?? null,
        hostname: hostname ?? null
      }
    })
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Cloudflare API error", status: response.status },
      { status: 502 }
    );
  }

  const payload = await response.json();
  const account = payload?.data?.viewer?.accounts?.[0];
  const ops: R2OperationRow[] = account?.r2OperationsAdaptiveGroups ?? [];
  const storage: R2StorageRow | undefined =
    account?.r2StorageAdaptiveGroups?.[0];
  const geo: CountryRow[] =
    payload?.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups ?? [];

  const totals = ops.reduce(
    (acc, row) => {
      const count = row.sum?.requests ?? 0;
      acc.requests += count;
      if (row.dimensions?.actionType === "GET") {
        acc.getRequests += count;
      }
      if (row.dimensions?.actionType === "PUT") {
        acc.putRequests += count;
      }
      return acc;
    },
    { requests: 0, getRequests: 0, putRequests: 0 }
  );

  return NextResponse.json({
    range: { start: startIso, end: endIso, days },
    totals,
    byAction: ops,
    storage: storage?.max ?? null,
    topCountries: geo
  });
}
