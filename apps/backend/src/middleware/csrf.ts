import { config } from "../config/env.ts";
import { AppError } from "../shared/errors.ts";

export function csrf(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  if (
    request.headers.get("origin") !== config().appUrl ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AppError(
      403,
      "CSRF",
      "This request came from an untrusted origin.",
    );
}
