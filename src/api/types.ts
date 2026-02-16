export type Gender = "male" | "female";
export type JerseySize = "XS" | "S" | "M" | "L" | "XL";

export type ChatMsg = { room: string; user: string; content: string; ts: number };

export type ChatMessageDTO = { id: string; room: string; user: string; content: string; ts: string };

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
  
    gender: "male" | "female";
    size: "XS" | "S" | "M" | "L" | "XL";
  };
  
