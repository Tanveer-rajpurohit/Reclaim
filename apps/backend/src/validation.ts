import { z } from "zod";
import { AppError } from "./errors.ts";

export const id = z.uuid();
export const email = z
  .email()
  .max(254)
  .transform((s) => s.toLowerCase());
export const password = z.string().min(10).max(128);
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
