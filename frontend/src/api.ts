function resolveApiBase(): string {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  return "";
}

export function getWsUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/portfolio`;
}

export function getAppUrl(): string {
  return `${window.location.protocol}//${window.location.host}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = resolveApiBase();
  const url = `${base}${path}`;
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      `Cannot reach server at ${getAppUrl()}. ` +
        `Start backend: cd backend && DEMO_MODE=true python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000`,
    );
  }
}

export async function fetchServerInfo() {
  const res = await apiFetch("/api/server-info");
  if (!res.ok) return null;
  return res.json() as Promise<{
    ib_default_host: string;
    ib_default_port: number;
    ib_default_client_id: number;
    demo_mode: boolean;
    bind_host: string;
    bind_port: number;
  }>;
}
