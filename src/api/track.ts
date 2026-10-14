import { gpxApiBase } from "./gpx";
import type { TrackDTO } from "./types";

async function gpxApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${gpxApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "omit",
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      message = (await res.json())?.error || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export async function fetchTracks(): Promise<TrackDTO[]> {
  return gpxApi("/tracks");
}

export async function createTrack(payload: {
  title: string;
  storageUrl?: string | null;
  distanceKm: number;
  elevationGainM: number;
  svgPath?: string | null;
}): Promise<TrackDTO> {
  return gpxApi("/tracks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
