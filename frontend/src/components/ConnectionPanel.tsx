import { useEffect, useState } from "react";
import { fetchServerInfo } from "../api";
import type { ConnectionConfig } from "../types";

interface ConnectionPanelProps {
  connected: boolean;
  demoMode: boolean;
  connecting: boolean;
  accounts: string[];
  activeAccount: string | null;
  message: string | null;
  onConnect: (config: ConnectionConfig) => void;
  onDisconnect: () => void;
  onAccountChange: (account: string) => void;
}

export function ConnectionPanel({
  connected,
  demoMode,
  connecting,
  accounts,
  activeAccount,
  message,
  onConnect,
  onDisconnect,
  onAccountChange,
}: ConnectionPanelProps) {
  const [expanded, setExpanded] = useState(!connected);
  const [config, setConfig] = useState<ConnectionConfig>({
    host: "127.0.0.1",
    port: 7497,
    client_id: 1,
    readonly: true,
  });

  useEffect(() => {
    fetchServerInfo().then((info) => {
      if (!info) return;
      setConfig((prev) => ({
        ...prev,
        host: info.ib_default_host,
        port: info.ib_default_port,
        client_id: info.ib_default_client_id,
      }));
    });
  }, []);

  return (
    <div className="rounded-xl border border-white/5 bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">IBKR Connection</h2>
          {message && (
            <p className={`mt-1 text-xs ${demoMode ? "text-amber-400" : "text-gray-400"}`}>
              {message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {connected && accounts.length > 1 && (
            <select
              value={activeAccount ?? ""}
              onChange={(e) => onAccountChange(e.target.value)}
              className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            >
              {accounts.map((acct) => (
                <option key={acct} value={acct}>
                  {acct}
                </option>
              ))}
            </select>
          )}

          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={connecting}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-loss/50 hover:text-loss disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-accent/50 hover:text-white"
            >
              {expanded ? "Hide Settings" : "Connect to IBKR"}
            </button>
          )}
        </div>
      </div>

      {expanded && !connected && (
        <div className="mt-5 grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs text-gray-400">TWS / Gateway Host</span>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="127.0.0.1 or 192.168.1.207"
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Port</span>
            <input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Client ID</span>
            <input
              type="number"
              value={config.client_id}
              onChange={(e) => setConfig({ ...config, client_id: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={config.readonly}
              onChange={(e) => setConfig({ ...config, readonly: e.target.checked })}
              className="rounded border-white/20 bg-surface text-accent focus:ring-accent"
            />
            <span className="text-sm text-gray-300">Read-only</span>
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              onClick={() => onConnect(config)}
              disabled={connecting}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-muted disabled:opacity-50 sm:w-auto"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              TWS must allow API connections from this machine. In TWS: Configure → API → Settings →
              add your server IP to <strong className="text-gray-400">Trusted IPs</strong>.
              Ports: 7497 (paper), 7496 (live), 4001 (Gateway).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
