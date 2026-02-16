import { apiBase } from "./client";

export type UploadGpxResponse = { blobName: string; downloadUrl: string };

export async function uploadGpx(file: File): Promise<UploadGpxResponse> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${apiBase()}/gpx/upload`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json();
}
