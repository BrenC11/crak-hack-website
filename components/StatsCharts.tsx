"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Point24h = {
  key: string;
  label: string;
  visits: number;
  views: number;
};

type Point7d = {
  day: string;
  visits: number;
  views: number;
};

function TooltipBox({
  active,
  label,
  payload
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-hud/30 bg-black/85 px-4 py-3 text-xs text-ice/80 shadow-glow">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-ice/50">
        {label}
      </div>
      <div className="space-y-1">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6">
            <span className="text-ice/60">{p.name}</span>
            <span className="font-medium text-ice">
              {typeof p.value === "number" ? p.value.toLocaleString("en-GB") : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsCharts({
  points24h,
  points7d
}: {
  points24h: Point24h[];
  points7d: Point7d[];
}) {
  return (
    <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
      <div className="glass-border rounded-2xl bg-black/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
          Trend (24h)
        </p>
        <div className="mt-5 h-56">
          {!points24h.length ? (
            <p className="text-sm text-ice/60">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points24h} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(223,233,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "rgba(223,233,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "rgba(223,233,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<TooltipBox />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Page Views"
                  stroke="rgba(69, 217, 255, 0.9)"
                  fill="rgba(69, 217, 255, 0.18)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Visits"
                  stroke="rgba(179, 255, 87, 0.9)"
                  fill="rgba(179, 255, 87, 0.14)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-border rounded-2xl bg-black/70 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-hud/60">
          Trend (7d)
        </p>
        <div className="mt-5 h-56">
          {!points7d.length ? (
            <p className="text-sm text-ice/60">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points7d} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="rgba(223,233,255,0.08)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(223,233,255,0.55)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "rgba(223,233,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<TooltipBox />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Page Views"
                  stroke="rgba(69, 217, 255, 0.9)"
                  fill="rgba(69, 217, 255, 0.18)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Visits"
                  stroke="rgba(179, 255, 87, 0.9)"
                  fill="rgba(179, 255, 87, 0.14)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

