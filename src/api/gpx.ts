// Keep uploads on the I Ride Mallorca origin. Netlify proxies this path to
// Azure, avoiding browser CORS failures when a rider adds a planned route.
export const GPX_API_BASE = "/gpx-api";

export function gpxApiBase() {
  return GPX_API_BASE.replace(/\/$/, "");
}

export type UploadGpxResponse = { blobName: string; downloadUrl: string };

export async function uploadGpx(file: File): Promise<UploadGpxResponse> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${gpxApiBase()}/gpx/upload`, {
    method: "POST",
    body: fd,
    credentials: "omit",
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try { message = (await res.json())?.error || message; } catch {}
    throw new Error(message);
  }

  return res.json();
}
