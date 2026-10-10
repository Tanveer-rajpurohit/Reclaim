import { AppError } from "../shared/errors.ts";
import { limitedBytes } from "../http/request.ts";

export async function body(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "INVALID_MEDIA", "Send a JSON request.");
  try {
    return JSON.parse(
      (await limitedBytes(request, 128_000)).toString("utf8"),
    ) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      400,
      "INVALID_JSON",
      "The request body is not valid JSON.",
    );
  }
}
