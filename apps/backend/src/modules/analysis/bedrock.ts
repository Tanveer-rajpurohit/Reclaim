import { z } from "zod";
import { AppError } from "../../shared/errors.ts";
import { limitedBytes } from "../../http/request.ts";
import { awsError } from "../../shared/aws-errors.ts";
import type { AnalysisConfig } from "./config.ts";

const responseSchema = z.object({
  stopReason: z.literal("end_turn"),
  output: z.object({
    message: z.object({
      content: z.array(z.object({ text: z.string().optional() })).min(1),
    }),
  }),
});
export interface InferenceInput {
  model: string;
  system: string;
  text: string;
  image?: Buffer;
  signal?: AbortSignal;
}
export async function converse(
  cfg: AnalysisConfig,
  input: InferenceInput,
  transport: typeof fetch = fetch,
): Promise<string> {
  const content: unknown[] = [{ text: input.text }];
  if (input.image)
    content.push({
      image: {
        format: "jpeg",
        source: { bytes: input.image.toString("base64") },
      },
    });
  try {
    const response = await transport(
      `https://bedrock-runtime.${cfg.region}.amazonaws.com/model/${encodeURIComponent(input.model)}/converse`,
      {
        method: "POST",
        redirect: "error",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        signal: input.signal
          ? AbortSignal.any([input.signal, AbortSignal.timeout(40_000)])
          : AbortSignal.timeout(40_000),
        body: JSON.stringify({
          system: [{ text: input.system }],
          messages: [{ role: "user", content }],
          inferenceConfig: {
            maxTokens: cfg.maxTokens,
            temperature: cfg.temperature,
          },
        }),
      },
    );
    if (!response.ok) {
      const code = response.headers.get("x-amzn-errortype")?.split(":")[0];
      await response.body?.cancel();
      throw awsError("Bedrock", {
        code,
        $metadata: {
          httpStatusCode: response.status,
          requestId: response.headers.get("x-amzn-requestid") || undefined,
        },
      });
    }
    const bytes = await limitedBytes(
      new Request("http://bedrock-response.local", {
        method: "POST",
        body: response.body,
        duplex: "half",
      } as RequestInit & { duplex: string }),
      128_000,
    );
    const result = responseSchema.safeParse(
      JSON.parse(bytes.toString("utf8")) as unknown,
    );
    if (!result.success)
      throw new AppError(
        502,
        "INVALID_ANALYSIS",
        "The photo suggestions were incomplete. Add materials manually or try a clearer photo.",
      );
    const text = result.data.output.message.content
      .map((part) => part.text || "")
      .join("");
    if (!text.trim())
      throw new AppError(
        502,
        "INVALID_ANALYSIS",
        "No photo suggestions were returned.",
      );
    return text;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "TimeoutError")
      throw new AppError(
        504,
        "BEDROCK_TIMEOUT",
        "Photo analysis took too long. Try again or enter item details yourself.",
      );
    throw new AppError(
      503,
      "BEDROCK_UNAVAILABLE",
      "Photo suggestions could not finish. Your manual entries are unchanged.",
    );
  }
}
