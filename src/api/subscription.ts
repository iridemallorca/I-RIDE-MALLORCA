import { api } from "@/api/client";

export type SubscribeResponse = {
  subscriber: { id?: string; email: string; createdAt?: string };
  alreadySubscribed: boolean;
  emailStatus: { owner: "fulfilled" | "not-sent" };
};

export function subscribeEmail(email: string) {
  return api<SubscribeResponse>("/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
