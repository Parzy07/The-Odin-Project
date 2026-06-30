import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { apiFetch, getAppUrl, getWsUrl } from "../api";
import type { ConnectionConfig, ConnectionStatus, PortfolioSnapshot } from "../types";

type StreamMode = "websocket" | "polling" | "offline";

function applySnapshot(
  data: PortfolioSnapshot,
  setSnapshot: (s: PortfolioSnapshot) => void,
  setStatus: Dispatch<SetStateAction<ConnectionStatus | null>>,
) {
  setSnapshot(data);
  setStatus((prev) =>
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
}

export function usePortfolio() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [streamMode, setStreamMode] = useState<StreamMode>("offline");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsFailures = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const fetchPortfolio = useCallback(async () => {
    const res = await apiFetch("/api/portfolio");
    if (!res.ok) throw new Error("Failed to fetch portfolio");
    const data: PortfolioSnapshot = await res.json();
    applySnapshot(data, setSnapshot, setStatus);
    return data;
  }, []);

  const fetchStatus = useCallback(async () => {
    const res = await apiFetch("/api/status");
    if (!res.ok) throw new Error("Failed to fetch status");
    const data: ConnectionStatus = await res.json();
    setStatus(data);
    return data;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setStreamMode("polling");
    setError(null);
    fetchPortfolio().catch((err) => setError(String(err)));
    pollTimer.current = setInterval(() => {
      fetchPortfolio().catch(() => {});
    }, 2000);
  }, [fetchPortfolio, stopPolling]);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      wsFailures.current = 0;
      stopPolling();
      setStreamMode("websocket");
      setError(null);
    };

    ws.onmessage = (event) => {
      const data: PortfolioSnapshot = JSON.parse(event.data);
      applySnapshot(data, setSnapshot, setStatus);
    };

    ws.onclose = () => {
      setStreamMode("offline");
      wsFailures.current += 1;

      if (wsFailures.current >= 2) {
        startPolling();
        return;
      }

      reconnectTimer.current = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [startPolling, stopPolling]);

  useEffect(() => {
    fetchStatus()
      .then(() => fetchPortfolio())
      .catch((err) => {
        setStreamMode("offline");
        setError(
          `${String(err)} — Open this app at ${getAppUrl()}. ` +
            "If using Cursor, open the forwarded port URL from the Ports panel (not 192.168.x.x).",
        );
      });
    connectWs();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      stopPolling();
      wsRef.current?.close();
    };
  }, [connectWs, fetchPortfolio, fetchStatus, stopPolling]);

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
      await fetchPortfolio();
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
      await fetchPortfolio();
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
      await fetchPortfolio();
    } catch (err) {
      setError(String(err));
    }
  };

  return {
    snapshot,
    status,
    streamMode,
    wsConnected: streamMode === "websocket",
    error,
    connecting,
    connect,
    disconnect,
    setAccount,
  };
}
