export class AppError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export function rule(
  condition: unknown,
  message: string,
  status = 409,
): asserts condition {
  if (!condition)
    throw new AppError(
      status,
      status === 403 ? "FORBIDDEN" : "CONFLICT",
      message,
    );
}
export function notFound(message = "This record was not found."): never {
  throw new AppError(404, "NOT_FOUND", message);
}
