export class APIError extends Error {
  constructor(
    message: string,
    code: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
  code: string;
  status: number;
  fields?: Record<string, string>;
}
export const sessionExpiredEvent = "reclaim:session-expired";
let refreshPromise: Promise<void> | null = null;
let generation = 0;
let refreshFailure: Error | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function responseData<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = response.status === 204 ? undefined : await response.json();
  } catch {
    throw new APIError(
      "The server returned an unreadable response. Please try again.",
      "INVALID_RESPONSE",
      response.status,
    );
  }
  if (!response.ok) {
    const error = isRecord(data) && isRecord(data.error) ? data.error : {};
    const fields = isRecord(error.fields)
      ? Object.fromEntries(
          Object.entries(error.fields).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : undefined;
    throw new APIError(
      typeof error.message === "string" ? error.message : "The request failed.",
      typeof error.code === "string" ? error.code : "REQUEST_FAILED",
      response.status,
      fields,
    );
  }
  return data as T;
}

async function waitForRefresh(
  promise: Promise<void>,
  signal?: AbortSignal | null,
) {
  if (!signal) return promise;
  signal.throwIfAborted();
  let abort: () => void = () => undefined;
  try {
    await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        abort = () => reject(signal.reason);
        signal.addEventListener("abort", abort, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

async function refreshAccess(version: number, signal?: AbortSignal | null) {
  if (version !== generation) {
    if (refreshFailure) throw refreshFailure;
    return;
  }
  if (!refreshPromise) {
    const origin =
      typeof window === "undefined"
        ? "http://localhost"
        : window.location.origin;
    refreshPromise = Promise.resolve().then(async () => {
      try {
        await responseData(
          await fetch(new URL("/api/auth/refresh", origin), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
            credentials: "same-origin",
            cache: "no-store",
            signal: AbortSignal.timeout(20000),
          }),
        );
        refreshFailure = null;
      } catch (cause) {
        refreshFailure =
          cause instanceof Error
            ? cause
            : new Error("Your session could not be refreshed.");
        if (
          cause instanceof APIError &&
          cause.status === 401 &&
          typeof window !== "undefined"
        )
          window.dispatchEvent(new Event(sessionExpiredEvent));
        throw refreshFailure;
      } finally {
        generation++;
        refreshPromise = null;
      }
    });
  }
  await waitForRefresh(refreshPromise, signal);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const origin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const url = new URL(path, origin);
  const authRoute =
    url.pathname.startsWith("/api/auth/") &&
    url.pathname !== "/api/auth/session";
  if (refreshPromise && url.pathname !== "/api/auth/refresh")
    await waitForRefresh(refreshPromise, options.signal);
  const version = generation;
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const request = new Request(url, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  try {
    return await responseData<T>(await fetch(request.clone()));
  } catch (cause) {
    if (
      authRoute ||
      !(cause instanceof APIError) ||
      cause.status !== 401 ||
      !["ACCESS_EXPIRED", "UNAUTHENTICATED"].includes(cause.code)
    )
      throw cause;
    try {
      await refreshAccess(version, request.signal);
    } catch (error) {
      const publicRead =
        request.method === "GET" &&
        (url.pathname === "/api/board" ||
          url.pathname === "/api/items" ||
          /^\/api\/(items|users)\/[^/]+$/.test(url.pathname));
      if (!(error instanceof APIError && error.status === 401 && publicRead))
        throw error;
    }
    request.signal.throwIfAborted();
    return responseData<T>(await fetch(request.clone()));
  }
}
