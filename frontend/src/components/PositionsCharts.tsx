import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PositionRow } from "../types";
import { formatCurrency } from "../utils/format";
import {
  getAllocationData,
  getMarketValueData,
  getPnlData,
} from "../utils/chartData";

interface PositionsChartsProps {
  positions: PositionRow[];
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-raised p-5 shadow-lg shadow-black/20">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-white">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-mono">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function AllocationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { symbol: string; value: number; weight: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-surface-overlay px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-white">{item.symbol}</p>
      <p className="font-mono text-gray-300">{formatCurrency(item.value)}</p>
      <p className="text-gray-500">{item.weight.toFixed(1)}% of portfolio</p>
    </div>
  );
}

export function PositionsCharts({ positions }: PositionsChartsProps) {
  if (positions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/5 bg-surface-raised">
        <p className="text-gray-500">No positions to chart</p>
      </div>
    );
  }

  const allocation = getAllocationData(positions);
  const pnlData = getPnlData(positions);
  const marketValueData = getMarketValueData(positions);
  const totalValue = allocation.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Portfolio Allocation" subtitle="By market value">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="symbol"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                stroke="transparent"
              >
                {allocation.map((entry) => (
                  <Cell key={entry.symbol} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<AllocationTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full space-y-2 sm:max-w-[180px]">
            {allocation.map((slice) => (
              <div key={slice.symbol} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.fill }}
                  />
                  <span className="font-medium text-gray-300">{slice.symbol}</span>
                </div>
                <span className="font-mono text-gray-400">{slice.weight.toFixed(1)}%</span>
              </div>
            ))}
            <div className="border-t border-white/5 pt-2 text-xs text-gray-500">
              Total: <span className="font-mono text-gray-300">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Market Value" subtitle="Position size comparison">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={marketValueData} layout="vertical" margin={{ left: 4, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              tick={{ fill: "#d1d5db", fontSize: 12 }}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => (
                <CurrencyTooltip
                  active={active}
                  label={label}
                  payload={payload?.map((p) => ({
                    value: p.value as number,
                    name: "Market Value",
                    color: "#3b82f6",
                  }))}
                />
              )}
            />
            <Bar dataKey="marketValue" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {marketValueData.map((entry) => (
                <Cell key={entry.symbol} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      </div>

      <ChartCard title="P&L by Position" subtitle="Unrealized vs daily">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pnlData} margin={{ top: 8, right: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
            <XAxis
              dataKey="symbol"
              tick={{ fill: "#d1d5db", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              tickFormatter={(v) => `$${v}`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
              formatter={(value) => <span className="text-gray-400">{value}</span>}
            />
            <Bar
              dataKey="unrealized"
              name="Unrealized P&L"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="daily"
              name="Daily P&L"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
