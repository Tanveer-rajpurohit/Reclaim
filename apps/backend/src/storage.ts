import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "./config.ts";
import { prisma, query } from "./db.ts";
import { type Identity, rateLimit } from "./auth.ts";
import { AppError, notFound } from "./errors.ts";

const maxBytes = 10_000_000;
async function limitedBytes(request: Request, limit: number) {
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
export { limitedBytes };
async function putObject(key: string, bytes: Buffer) {
  const cfg = config();
  if (cfg.storage === "local") {
    await mkdir(join(cfg.localDir, "photos"), { recursive: true });
    await writeFile(
      join(cfg.localDir, "photos", key.split("/").at(-1)!),
      bytes,
      { flag: "wx" },
    );
  } else
    await new S3Client({ region: cfg.region }).send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: bytes,
        ContentType: "image/jpeg",
        ServerSideEncryption: "AES256",
      }),
    );
}
async function removeObject(key: string) {
  const cfg = config();
  if (cfg.storage === "local")
    await unlink(join(cfg.localDir, "photos", key.split("/").at(-1)!));
  else
    await new S3Client({ region: cfg.region }).send(
      new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }),
    );
}
export async function uploadPhoto(request: Request, actor: Identity) {
  await rateLimit(`upload:${actor.id}`, 100, 3600);
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data;"))
    throw new AppError(415, "INVALID_MEDIA", "Send a multipart photo upload.");
  let form: FormData;
  try {
    form = await new Response(await limitedBytes(request, maxBytes + 100_000), {
      headers: { "content-type": contentType },
    }).formData();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(400, "INVALID_UPLOAD", "The upload could not be read.");
  }
  const file = form.get("photo");
  if (
    !(file instanceof File) ||
    form.getAll("photo").length !== 1 ||
    file.size > maxBytes ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new AppError(
      422,
      "INVALID_PHOTO",
      "Use one JPG, PNG or WebP photo smaller than 10 MB.",
    );
  const input = Buffer.from(await file.arrayBuffer());
  let image: Buffer;
  try {
    const reader = sharp(input, {
      limitInputPixels: 25_000_000,
      animated: false,
      failOn: "warning",
    });
    const metadata = await reader.metadata();
    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages || 1) > 1
    )
      throw new Error("Unsupported photo.");
    image = await reader
      .rotate()
      .resize(1440, 1440, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    if (image.length > 1_500_000) throw new Error("Photo too large.");
  } catch {
    throw new AppError(
      422,
      "INVALID_PHOTO",
      "This file is not a supported photo, is damaged, or is too large to process.",
    );
  }
  const uploadId = randomUUID();
  const key = `derivatives/${uploadId}.jpg`;
  await putObject(key, image);
  try {
    await prisma().upload.create({
      data: {
        id: uploadId,
        owner_id: actor.id,
        object_key: key,
        bytes: image.length,
      },
    });
  } catch (error) {
    await removeObject(key).catch(() => undefined);
    throw error;
  }
  return { id: uploadId, url: `/api/photos/${uploadId}` };
}
export async function readPhoto(uploadId: string, actor: Identity | null) {
  const result = await query(
    prisma(),
    `SELECT u.object_key FROM uploads u WHERE u.id=$1 AND
    (u.owner_id=$2 OR EXISTS(SELECT 1 FROM item_photos p JOIN items i ON i.id=p.item_id JOIN events e ON e.id=i.event_id
      WHERE p.upload_id=u.id AND (i.state IN ('Available','Reserved') OR e.owner_id=$2 OR EXISTS(SELECT 1 FROM deals d WHERE d.item_id=i.id AND d.buyer_id=$2))))`,
    [uploadId, actor?.id || null],
  );
  if (!result.rowCount) notFound("Photo not found.");
  const key: string = result.rows[0]!.object_key;
  const cfg = config();
  if (cfg.storage === "local")
    return readFile(join(cfg.localDir, "photos", key.split("/").at(-1)!));
  const object = await new S3Client({ region: cfg.region }).send(
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
  );
  if (!object.Body) notFound("Photo not found.");
  return Buffer.from(await object.Body.transformToByteArray());
}
