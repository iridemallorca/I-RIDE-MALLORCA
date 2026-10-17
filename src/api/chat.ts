import { api } from "./client";
import type { CommunityMessageDTO } from "./types";

export async function fetchCommunityMessages(limit = 100): Promise<CommunityMessageDTO[]> {
  return api(`/community/messages?limit=${encodeURIComponent(String(limit))}`);
}

export async function sendCommunityMessage(payload: { sessionId: string; displayName: string; content: string; replyToId?: string | null }): Promise<CommunityMessageDTO> {
  return api("/community/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reportCommunityMessage(id: string, payload: { sessionId: string; reason: string }): Promise<{ hidden: boolean; reportCount: number }> {
  return api(`/community/messages/${encodeURIComponent(id)}/report`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
