import { api } from "./client";
import type { TrackDTO } from "./types";

export async function fetchTracks(): Promise<TrackDTO[]> {
  return api("/tracks");
}

export async function createTrack(payload: {
  title: string;
  storageUrl?: string | null;
  distanceKm: number;
  elevationGainM: number;
  svgPath?: string | null;
}): Promise<TrackDTO> {
  return api("/tracks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
