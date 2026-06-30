import { getAppUrl } from "../api";

export function ServerAccessBanner() {
  const appUrl = getAppUrl();
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (!isLocalhost) {
    return (
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-gray-300">
        Connected via <span className="font-mono text-accent">{appUrl}</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-gray-300">
      <p>
        Access from other devices on your network:{" "}
        <span className="font-mono text-amber-300">http://192.168.1.207:8000</span>
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Start server with <span className="font-mono">--host 0.0.0.0</span>. Do not use
        localhost from phones or other PCs.
      </p>
    </div>
  );
}
