import { api } from "./client";
import type { OrderDraft, OrderProduct } from "./types";

export async function createOrder(d: OrderDraft, product?: OrderProduct) {
  if (!product) throw new Error("Please choose a jersey before sending your order request.");

  return api("/orders", {
    method: "POST",
    body: JSON.stringify({
      productName: product.name,
      productColour: product.colour,
      productPrice: product.price,
      buyerName: d.buyerName,
      buyerEmail: d.buyerEmail,
      buyerAddress: d.buyerAddress,
      shippingName: d.shippingName,
      shippingAddress: d.shippingAddress,
      gender: d.gender,
      size: d.size,
    }),
  });
}
