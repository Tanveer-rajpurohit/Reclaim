import { config } from "./config.ts";
import { AppError, notFound } from "./errors.ts";
import { prisma, query } from "./db.ts";

function json(
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      ...headers,
    },
  });
}
function csrf(request: Request) {
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
export async function handle(request: Request, path: string[]) {
  try {
    const method = request.method;
    const route = path.join("/");
    csrf(request);
    if (route === "health" && method === "GET") {
      await query(prisma(), "SELECT 1");
      return json({ ok: true });
    }
    notFound();
  } catch (error) {
    if (error instanceof AppError)
      return json(
        {
          error: {
            code: error.code,
            message: error.message,
            fields: error.fields,
          },
        },
        error.status,
        error.status === 429 ? { "Retry-After": "60" } : {},
      );
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ["23505", "40001", "40P01"].includes(String(error.code))
    )
      return json(
        {
          error: {
            code: "CONFLICT",
            message: "This record changed. Refresh and try again.",
          },
        },
        409,
      );
    console.error(
      "Backend request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      {
        error: {
          code: "INTERNAL",
          message:
            "The service could not complete this request. Please try again.",
        },
      },
      500,
    );
  }
}
