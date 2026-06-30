import { ConnectionPanel } from "./components/ConnectionPanel";
import { PositionsCharts } from "./components/PositionsCharts";
import { PositionsTable } from "./components/PositionsTable";
import { StatusBadge, SummaryCard } from "./components/SummaryCard";
import { usePortfolio } from "./hooks/usePortfolio";
import { formatTime } from "./utils/format";

export default function App() {
  const {
    snapshot,
    status,
    wsConnected,
    error,
    connecting,
    connect,
    disconnect,
    setAccount,
  } = usePortfolio();

  const summary = snapshot?.summary;
  const positions = snapshot?.positions ?? [];

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-white/5 bg-surface-raised/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              IBKR Portfolio Tracker
            </h1>
            <p className="text-sm text-gray-400">Real-time positions &amp; P&amp;L</p>
          </div>
          <StatusBadge
            connected={status?.connected ?? false}
            demoMode={status?.demo_mode ?? false}
            wsConnected={wsConnected}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {error && (
          <div className="rounded-lg border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">
            {error}
          </div>
        )}

        <ConnectionPanel
          connected={status?.connected ?? false}
          demoMode={status?.demo_mode ?? false}
          connecting={connecting}
          accounts={status?.accounts ?? []}
          activeAccount={status?.active_account ?? null}
          message={status?.message ?? null}
          onConnect={connect}
          onDisconnect={disconnect}
          onAccountChange={setAccount}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Net Liquidation" value={summary?.net_liquidation} />
          <SummaryCard
            label="Daily P&L"
            value={summary?.daily_pnl}
            highlight
          />
          <SummaryCard
            label="Unrealized P&L"
            value={summary?.unrealized_pnl}
            highlight
          />
          <SummaryCard label="Buying Power" value={summary?.buying_power} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total Cash" value={summary?.total_cash} />
          <SummaryCard label="Gross Position Value" value={summary?.gross_position_value} />
          <SummaryCard
            label="Realized P&L"
            value={summary?.realized_pnl}
            highlight
          />
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Portfolio Charts</h2>
            <p className="text-sm text-gray-500">Allocation, size, and P&amp;L at a glance</p>
          </div>
          <PositionsCharts positions={positions} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Positions</h2>
            <span className="text-xs text-gray-500">
              Last update: {formatTime(snapshot?.timestamp)}
            </span>
          </div>
          <PositionsTable positions={positions} />
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-gray-600">
        Powered by Interactive Brokers API via ib_async
      </footer>
    </div>
  );
}
