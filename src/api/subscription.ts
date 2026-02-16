import { api } from "@/api/client";

export type SubscribeResponse = {
  subscriber: { id: string; email: string; createdAt: string };
  emailStatus: { customer: "fulfilled" | "rejected"; owner: "fulfilled" | "rejected" };
};

export function subscribeEmail(email: string) {
  return api<SubscribeResponse>("/subscribe", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
