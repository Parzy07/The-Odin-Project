function resolveApiBase(): string {
  const envBase = import.meta.env.VITE_API_URL;
  if (envBase) return envBase.replace(/\/$/, "");
  return "";
}

function resolveWsUrl(): string {
  const envWs = import.meta.env.VITE_WS_URL;
  if (envWs) return envWs;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/portfolio`;
}

export const API_BASE = resolveApiBase();
export const WS_URL = resolveWsUrl();

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      `Cannot reach the server at ${url || path}. ` +
        "Make sure the backend is running: " +
        "cd backend && DEMO_MODE=true python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000",
    );
  }
}
