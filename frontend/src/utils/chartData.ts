import type { PositionRow } from "../types";

export interface AllocationSlice {
  symbol: string;
  value: number;
  weight: number;
  fill: string;
}

export interface PnlBar {
  symbol: string;
  unrealized: number;
  daily: number;
}

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export function getAllocationData(positions: PositionRow[]): AllocationSlice[] {
  const total = positions.reduce((sum, p) => sum + Math.abs(p.market_value ?? 0), 0);
  if (total === 0) return [];

  return positions
    .map((p, i) => ({
      symbol: p.symbol,
      value: Math.abs(p.market_value ?? 0),
      weight: ((Math.abs(p.market_value ?? 0) / total) * 100),
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function getPnlData(positions: PositionRow[]): PnlBar[] {
  return [...positions]
    .map((p) => ({
      symbol: p.symbol,
      unrealized: p.unrealized_pnl ?? 0,
      daily: p.daily_pnl ?? 0,
    }))
    .sort((a, b) => Math.abs(b.unrealized) - Math.abs(a.unrealized));
}

export function getMarketValueData(positions: PositionRow[]) {
  return [...positions]
    .map((p, i) => ({
      symbol: p.symbol,
      marketValue: p.market_value ?? 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .sort((a, b) => b.marketValue - a.marketValue);
}

export { CHART_COLORS };
