export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "APIError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
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
