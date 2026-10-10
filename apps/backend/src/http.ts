import { config } from "./config.ts";
import { AppError, notFound } from "./errors.ts";
import { prisma, query } from "./db.ts";
import { identity, register, login, logout, sessionCookie, consumeAuthToken, sendAuthLink } from "./auth.ts";
import { limitedBytes } from "./storage.ts";

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
async function body(request: Request) {
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
export async function handle(request: Request, path: string[]) {
  try {
    const method = request.method;
    const route = path.join("/");
    csrf(request);
    if (route === "health" && method === "GET") {
      await query(prisma(), "SELECT 1");
      return json({ ok: true });
    }
    if (path[0] === "auth") {
      if (method === "POST") {
        const input = await body(request);
        if (route === "auth/register") return json(await register(input), 201);
        if (route === "auth/login") {
          const result = await login(input);
          return json({ ok: true }, 200, {
            "Set-Cookie": sessionCookie(result.token),
          });
        }
        if (route === "auth/logout") {
          await logout(request);
          return json({ ok: true }, 200, {
            "Set-Cookie": sessionCookie("", true),
          });
        }
        if (route === "auth/verify")
          return json(await consumeAuthToken(input, "verify"));
        if (route === "auth/reset")
          return json(await consumeAuthToken(input, "reset"));
        if (route === "auth/resend")
          return json(await sendAuthLink(input, "verify"));
        if (route === "auth/forgot")
          return json(await sendAuthLink(input, "reset"));
      }
      if (route === "auth/session" && method === "GET")
        return json({ user: await identity(request) });
      notFound();
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
