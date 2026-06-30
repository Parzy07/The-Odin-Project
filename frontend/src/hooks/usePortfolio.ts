import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, WS_URL } from "../api";
import type { ConnectionConfig, ConnectionStatus, PortfolioSnapshot } from "../types";

export function usePortfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    const res = await apiFetch("/api/status");
    if (!res.ok) throw new Error("Failed to fetch status");
    const data: ConnectionStatus = await res.json();
    setStatus(data);
    return data;
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      const data: PortfolioSnapshot = JSON.parse(event.data);
      setSnapshot(data);
      setStatus((prev: ConnectionStatus | null) =>
        prev
          ? {
              ...prev,
              connected: data.connected,
              demo_mode: data.demo_mode,
              accounts: data.accounts,
              active_account: data.account,
              message: data.message,
            }
          : {
              connected: data.connected,
              demo_mode: data.demo_mode,
              accounts: data.accounts,
              active_account: data.account,
              message: data.message,
            },
      );
    };

    ws.onclose = () => {
      setWsConnected(false);
      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      setError(
        "WebSocket connection failed. Open http://localhost:8000 (single server) " +
          "or ensure the backend is running on port 8000.",
      );
    };
  }, []);

  useEffect(() => {
    fetchStatus().catch((err) => setError(String(err)));
    connectWs();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connectWs, fetchStatus]);

  const connect = async (config?: ConnectionConfig) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: config ? JSON.stringify(config) : "{}",
      });
      if (!res.ok) throw new Error("Connection request failed");
      const data: ConnectionStatus = await res.json();
      setStatus(data);
      if (!data.connected) {
        setError(data.message || "Failed to connect to IBKR");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setConnecting(true);
    try {
      const res = await apiFetch("/api/disconnect", { method: "POST" });
      const data: ConnectionStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setConnecting(false);
    }
  };

  const setAccount = async (account: string) => {
    try {
      const res = await apiFetch(`/api/account/${encodeURIComponent(account)}`, {
        method: "POST",
      });
      const data: ConnectionStatus = await res.json();
      setStatus(data);
    } catch (err) {
      setError(String(err));
    }
  };

  return {
    snapshot,
    status,
    wsConnected,
    error,
    connecting,
    connect,
    disconnect,
    setAccount,
  };
}
