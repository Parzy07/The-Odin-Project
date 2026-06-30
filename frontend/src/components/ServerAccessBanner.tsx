import { useEffect, useState } from "react";
import { apiFetch, getAppUrl } from "../api";

export function ServerAccessBanner() {
  const appUrl = getAppUrl();
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch("/api/health")
      .then((res) => setApiOk(res.ok))
      .catch(() => setApiOk(false));
  }, []);

  if (apiOk === false) {
    return (
      <div className="rounded-lg border border-loss/30 bg-loss/10 px-4 py-4 text-sm">
        <p className="font-medium text-loss">Cannot reach the server from your laptop</p>
        <p className="mt-2 text-gray-300">
          You are at <span className="font-mono text-white">{appUrl}</span> but the API is not
          responding.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-gray-400">
          <li>
            Run <span className="font-mono">./start.sh</span> in the project folder on your laptop
          </li>
          <li>
            Then open <span className="font-mono">http://localhost:8000</span> (not 192.168.x.x)
          </li>
          <li>
            Check terminal shows: <span className="font-mono">Uvicorn running on http://0.0.0.0:8000</span>
          </li>
        </ul>
      </div>
    );
  }

  const host = window.location.hostname;
  const isLocalhost = host === "localhost" || host === "127.0.0.1";

  if (isLocalhost) {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-gray-300">
        Dashboard running at{" "}
        <span className="font-mono text-accent">{appUrl}</span>
        <span className="mt-1 block text-xs text-gray-500">
          On this laptop, localhost works. Other devices need your LAN IP on port 8000.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-gray-300">
      Connected from laptop via{" "}
      <span className="font-mono text-accent">{appUrl}</span>
    </div>
  );
}
