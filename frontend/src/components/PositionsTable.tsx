import type { PositionRow } from "../types";
import { formatCurrency, formatNumber } from "../utils/format";
import { PnlCell } from "./SummaryCard";

interface PositionsTableProps {
  positions: PositionRow[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  if (positions.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-white/5 bg-surface-raised">
        <p className="text-gray-500">No open positions</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-surface-raised shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-surface-overlay/50 text-xs uppercase tracking-wider text-gray-400">
              <th className="px-5 py-3 font-medium">Symbol</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium text-right">Qty</th>
              <th className="px-5 py-3 font-medium text-right">Avg Cost</th>
              <th className="px-5 py-3 font-medium text-right">Last</th>
              <th className="px-5 py-3 font-medium text-right">Market Value</th>
              <th className="px-5 py-3 font-medium text-right">Unrealized P&L</th>
              <th className="px-5 py-3 font-medium text-right">Daily P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {positions.map((pos) => (
              <tr
                key={`${pos.account}-${pos.con_id ?? pos.symbol}`}
                className="transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-white">{pos.symbol}</div>
                  <div className="text-xs text-gray-500">{pos.exchange}</div>
                </td>
                <td className="px-5 py-3.5 text-gray-400">{pos.sec_type}</td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                  {formatNumber(pos.position, 0)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-gray-300">
                  {formatCurrency(pos.avg_cost)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white">
                  {formatCurrency(pos.market_price)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono tabular-nums text-white">
                  {formatCurrency(pos.market_value)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <PnlCell value={pos.unrealized_pnl} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <PnlCell value={pos.daily_pnl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
