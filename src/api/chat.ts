import { api } from "./client";
import type { ChatMessageDTO } from "./types";

export async function fetchChat(room: string, limit = 200): Promise<ChatMessageDTO[]> {
  return api(`/chat/${encodeURIComponent(room)}?limit=${encodeURIComponent(String(limit))}`);
}

export async function sendChat(room: string, payload: { user: string; content: string; ts?: number }): Promise<ChatMessageDTO> {
  return api(`/chat/${encodeURIComponent(room)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
