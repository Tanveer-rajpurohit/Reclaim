import { z } from "zod";
import { AppError } from "./errors.ts";
import { categories, phoneValid } from "@repo/domain";

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const id = z.uuid();
export const email = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
export const password = z.string().min(10).max(128);
export const profileSchema = z
  .object({
    name: text(2, 40),
    area: text(2, 60),
    phone: z
      .string()
      .max(20)
      .refine(
        (v) => v === "" || phoneValid(v),
        "Use a valid Indian mobile number.",
      )
      .transform((v) => v.replace(/[\s-]/g, "").replace(/^\+91/, "")),
    buyerType: z.enum(["none", "reuse", "bulk"]),
    interests: z
      .array(z.enum(categories))
      .max(11)
      .transform((v) => [...new Set(v)]),
  })
  .strict();
export const photo = z
  .string()
  .refine(
    (value) =>
      value.startsWith("/api/photos/") &&
      id.safeParse(value.slice("/api/photos/".length)).success,
    "Choose a photo uploaded to Reclaim.",
  );
export const gallerySchema = z
  .object({ image: photo, images: z.array(photo).max(4).default([]) })
  .strict()
  .refine(
    (v) => new Set([v.image, ...v.images]).size === v.images.length + 1,
    "Each photo can appear only once.",
  );
export const itemSchema = z
  .object({
    name: text(3, 80),
    description: text(0, 600),
    category: z.enum(categories),
    purpose: z.enum(["Reuse", "Recycle"]),
    quantity: z.number().positive().max(999999999).multipleOf(0.001),
    unit: z.enum(["pieces", "bundles", "kg"]),
    condition: z.enum(["Good", "Fair", "Poor"]),
    price: z.number().min(0).max(1000000).multipleOf(0.01),
    hazards: text(0, 600),
    art: z.enum([
      "boards",
      "boxes",
      "pots",
      "cloth",
      "stand",
      "metal",
      "chair",
      "pallet",
      "bottles",
      "cables",
      "books",
      "crates",
    ]),
    image: photo,
    images: z.array(photo).max(4).default([]),
  })
  .strict()
  .refine((v) => v.unit === "kg" || Number.isInteger(v.quantity), {
    path: ["quantity"],
    message: "Pieces and bundles need a whole number.",
  })
  .refine((v) => new Set([v.image, ...v.images]).size === v.images.length + 1, {
    path: ["images"],
    message: "Each photo can appear only once.",
  });
const date = z.iso
  .date()
  .refine(
    (v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v,
    "Use a valid calendar date.",
  );
export const publishSchema = z
  .object({
    event: z
      .object({
        name: text(3, 80),
        area: text(2, 60),
        eventDate: date,
        pickupNote: text(0, 300).refine(
          (v) => !/(?:\d[\s-]*){10}/.test(v),
          "Keep phone numbers in your private profile.",
        ),
        deliveryNote: text(0, 300),
      })
      .strict(),
    items: z.array(itemSchema).min(1).max(20),
    safe: z.literal(true),
  })
  .strict();
export const requestSchema = z
  .object({ pickupAt: z.number().finite(), note: text(0, 300).default("") })
  .strict();
export const editSchema = z
  .object({
    name: text(3, 80),
    price: z.number().min(0).max(1000000).multipleOf(0.01),
  })
  .strict();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields = Object.fromEntries(
      result.error.issues.map((issue) => [
        issue.path.join(".") || "form",
        issue.message,
      ]),
    );
    throw new AppError(
      422,
      "VALIDATION",
      Object.values(fields)[0] || "Check the form fields.",
      fields,
    );
  }
  return result.data;
}
