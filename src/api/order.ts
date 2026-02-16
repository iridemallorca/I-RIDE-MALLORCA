import { api } from "./client";
import type { OrderDraft } from "./types";

export async function createOrder(d: OrderDraft) {
  const payload = {
    buyerName: d.buyerName,
    buyerEmail: d.buyerEmail,
    buyerAddress: d.buyerAddress,
    shippingName: d.shippingName,
    shippingAddress: d.shippingAddress,
    gender: d.gender,
    size: d.size,
  };

  return api("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
