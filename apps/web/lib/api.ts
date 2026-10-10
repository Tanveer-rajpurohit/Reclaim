export class APIError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  constructor(
    message: string,
    code: string,
    status: number,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new APIError(
      data.error?.message || "The request failed.",
      data.error?.code || "REQUEST_FAILED",
      response.status,
      data.error?.fields,
    );
  return data as T;
}
