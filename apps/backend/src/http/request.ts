import { AppError } from "../shared/errors.ts";

export async function limitedBytes(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new AppError(413, "TOO_LARGE", "The uploaded photo is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "EMPTY_BODY", "Add a photo.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > limit) {
        await reader.cancel();
        throw new AppError(
          413,
          "TOO_LARGE",
          "The uploaded photo is too large.",
        );
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}
