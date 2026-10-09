import type { Category } from "../materials/type";
export interface Person {
  id: string;
  name: string;
  phone: string;
  area: string;
  buyerType: "none" | "reuse" | "bulk";
  interests: Category[];
}
