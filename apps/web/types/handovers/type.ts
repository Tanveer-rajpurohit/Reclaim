export type DealStatus =
  "Pending" | "Accepted" | "Done" | "Declined" | "Cancelled";
export interface Deal {
  id: string;
  itemId: string;
  buyerId: string;
  status: DealStatus;
  pickupAt: number;
  note: string;
  createdAt: number;
  updatedAt: number;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  reason: string;
}
export interface HandoverDetailProps {
  id: string;
}
