import { api } from "./client";
import type { PartnerPostDTO } from "./types";

export async function fetchUpcomingPartners(): Promise<PartnerPostDTO[]> {
  return api("/partners?upcoming=true");
}

export async function createPartnerPost(payload: {
  name: string;
  whenISO: string;
  address?: string;
  pace?: number;
  note?: string;
  trackId?: string | null;
}): Promise<PartnerPostDTO> {
  return api("/partners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
