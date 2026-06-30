import type { ReactNode } from "react";
import { formatCurrency, pnlColor } from "../utils/format";

interface SummaryCardProps {
  label: string;
  value: number | null | undefined;
  subValue?: string;
  highlight?: boolean;
}

export function SummaryCard({ label, value, subValue, highlight }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-raised p-5 shadow-lg shadow-black/20">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
          highlight ? pnlColor(value) : "text-white"
        }`}
      >
        {formatCurrency(value)}
      </p>
      {subValue && <p className="mt-1 text-xs text-gray-500">{subValue}</p>}
    </div>
  );
}

interface StatusBadgeProps {
  connected: boolean;
  demoMode: boolean;
  streamMode: "websocket" | "polling" | "offline";
}

export function StatusBadge({ connected, demoMode, streamMode }: StatusBadgeProps) {
  let label: string;
  let color: string;

  if (!connected) {
    label = "Disconnected";
    color = "bg-gray-600";
  } else if (demoMode) {
    label = "Demo Mode";
    color = "bg-amber-500";
  } else {
    label = "Live";
    color = "bg-profit";
  }

  const streamLabel =
    streamMode === "websocket"
      ? "Stream active"
      : streamMode === "polling"
        ? "Polling (2s)"
        : "Server offline";

  const streamColor =
    streamMode === "websocket"
      ? "bg-accent"
      : streamMode === "polling"
        ? "bg-amber-500"
        : "bg-loss";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color} ${connected ? "animate-pulse" : ""}`} />
        <span className="text-sm font-medium text-gray-300">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <span className={`h-1.5 w-1.5 rounded-full ${streamColor}`} />
        {streamLabel}
      </div>
    </div>
  );
}

interface PnlCellProps {
  value: number | null | undefined;
  children?: ReactNode;
}

export function PnlCell({ value }: PnlCellProps) {
  return (
    <span className={`font-mono tabular-nums ${pnlColor(value)}`}>
      {formatCurrency(value)}
    </span>
  );
}
