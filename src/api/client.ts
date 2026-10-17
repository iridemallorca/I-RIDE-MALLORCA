// Keep browser API calls on the I Ride Mallorca origin. Netlify proxies this
// path to Azure, avoiding cross-origin browser failures during order requests.
const API_BASE = "/gpx-api";

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as any;
  return res.json();
}

export function apiBase() {
  return API_BASE;
}
