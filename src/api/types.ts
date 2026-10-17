export type Gender = "male" | "female";
export type JerseySize = "XS" | "S" | "M" | "L" | "XL";

export type CommunityMessageDTO = { id: string; user: string; content: string; ts: string };

export type TrackDTO = {
  id: string;
  title: string;
  storageUrl: string | null;
  distanceKm: number;
  elevationGainM: number;
  svgPath: string | null;
  createdAt: string;
};

export type PartnerPostDTO = {
  id: string;
  name: string;
  when: string;
  address: string | null;
  pace: number | null;
  note: string | null;
  track?: TrackDTO | null;
};

export type OrderDraft = {
  buyerName: string;
  buyerEmail: string;
  buyerAddress: string;
  shippingName: string;
  shippingAddress: string;
  shippingSameAsBuyer: boolean;
  gender: Gender;
  size: JerseySize;
};

export type OrderProduct = {
  name: string;
  price: number;
  colour: string;
};
