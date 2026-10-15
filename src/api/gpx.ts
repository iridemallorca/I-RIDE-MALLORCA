export const GPX_API_BASE =
  (import.meta as any).env?.VITE_GPX_API_URL ||
  "/gpx-api";

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
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json();
}
