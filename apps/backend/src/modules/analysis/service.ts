import { z } from "zod";
import { id, parse } from "../../shared/validation.ts";
import { rateLimit, type Identity } from "../auth/service.ts";
import { readOwnedPhoto } from "../photos/service.ts";
import { analysisConfig } from "./config.ts";
import { suggestDrafts } from "./drafts.ts";

const inputSchema = z.object({ photoId: id }).strict();
export async function analyzePhoto(
  input: unknown,
  actor: Identity,
  signal?: AbortSignal,
) {
  const { photoId } = parse(inputSchema, input);
  const cfg = analysisConfig();
  const image = await readOwnedPhoto(photoId, actor);
  await rateLimit(`analysis:${actor.id}`, 10, 3600);
  await rateLimit("analysis:global", 100, 3600);
  return suggestDrafts(cfg, image, `/api/photos/${photoId}`, signal);
}
