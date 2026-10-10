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
