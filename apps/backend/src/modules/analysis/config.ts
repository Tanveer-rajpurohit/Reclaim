import { AppError } from "../../shared/errors.ts";

export function analysisConfig() {
  if (process.env.BEDROCK_AGENT_ENABLED !== "true")
    throw new AppError(
      503,
      "ANALYSIS_DISABLED",
      "Photo suggestions are unavailable. You can describe materials manually.",
    );
  if (process.env.BEDROCK_CREDITS_CONFIRMED !== "true")
    throw new AppError(
      503,
      "CREDITS_UNCONFIRMED",
      "Photo suggestions are waiting for AWS credit confirmation. You can describe materials manually.",
    );
  const apiKey =
    process.env.AWS_BEARER_TOKEN_BEDROCK || process.env.AWS_BEDROCK_API_KEY;
  const region = process.env.AWS_REGION;
  const maxTokens = Number(process.env.AGENT_MAX_TOKENS || 4096);
  const temperature = Number(process.env.AGENT_TEMPERATURE || 0.1);
  const visionModel =
    process.env.AWS_BEDROCK_VISION_MODEL_ID || "apac.amazon.nova-lite-v1:0";
  const textModel = process.env.AWS_BEDROCK_MODEL_ID || "zai.glm-5";
  if (visionModel !== "apac.amazon.nova-lite-v1:0" || textModel !== "zai.glm-5")
    throw new AppError(
      503,
      "ANALYSIS_CONFIG",
      "Use the supported Nova Lite and GLM-5 serverless model IDs. Marketplace models are not enabled.",
    );
  if (!apiKey || !region || !/^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(region))
    throw new AppError(
      503,
      "ANALYSIS_CONFIG",
      "Photo suggestions need AWS configuration. You can describe materials manually.",
    );
  if (
    !Number.isInteger(maxTokens) ||
    maxTokens < 256 ||
    maxTokens > 4096 ||
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 1
  )
    throw new AppError(
      503,
      "ANALYSIS_CONFIG",
      "Photo suggestion settings are invalid.",
    );
  return {
    apiKey,
    region,
    maxTokens,
    temperature,
    visionModel,
    textModel,
  };
}
export type AnalysisConfig = ReturnType<typeof analysisConfig>;
