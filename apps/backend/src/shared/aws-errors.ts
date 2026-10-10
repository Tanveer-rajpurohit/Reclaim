import { AppError } from "./errors.ts";

type AwsFailure = {
  name?: string;
  code?: string;
  $metadata?: { httpStatusCode?: number; requestId?: string };
};

export function awsError(service: "S3" | "Bedrock", cause: AwsFailure) {
  // Keep provider bodies, credentials, bucket names and account IDs out of logs.
  const code = cause.code || cause.name || "UnknownError";
  console.error("AWS request failed", {
    service,
    code: /^[\w.-]{1,80}$/.test(code) ? code : "UnknownError",
    status: cause.$metadata?.httpStatusCode,
    requestId: /^[\w-]{1,100}$/.test(cause.$metadata?.requestId || "")
      ? cause.$metadata?.requestId
      : undefined,
  });
  const status = cause.$metadata?.httpStatusCode;
  const action =
    service === "S3" ? "save or load this photo" : "analyze this photo";
  if (status === 429 || /Throttl|TooManyRequests/.test(code))
    return new AppError(
      429,
      `${service.toUpperCase()}_BUSY`,
      "Photo processing is busy. Please try again in a minute.",
    );
  if (
    status === 401 ||
    /ExpiredToken|InvalidToken|InvalidAccessKeyId|SignatureDoesNotMatch|UnrecognizedClient/.test(
      code,
    )
  )
    return new AppError(
      503,
      `${service.toUpperCase()}_CREDENTIALS`,
      `AWS could not ${action} because its credentials are invalid or expired. Please contact support.`,
    );
  if (status === 403 || /AccessDenied|Forbidden/.test(code))
    return new AppError(
      503,
      `${service.toUpperCase()}_ACCESS_DENIED`,
      `AWS denied permission to ${action}. Please contact support. You can still enter item details yourself.`,
    );
  if (
    service === "S3" &&
    (status === 301 ||
      /PermanentRedirect|AuthorizationHeaderMalformed/.test(code))
  )
    return new AppError(
      503,
      "S3_REGION",
      "Photo storage is set to the wrong AWS region. Please contact support.",
    );
  if (service === "S3" && /NoSuchBucket/.test(code))
    return new AppError(
      503,
      "S3_BUCKET_MISSING",
      "Photo storage could not be found. Please contact support.",
    );
  if (service === "Bedrock" && (status === 400 || status === 404))
    return new AppError(
      503,
      "BEDROCK_MODEL_CONFIG",
      "AWS could not use the configured photo analysis model. Check its model ID and region. You can enter item details yourself.",
    );
  return new AppError(
    503,
    `${service.toUpperCase()}_UNAVAILABLE`,
    `AWS could not ${action}. Please try again later.`,
  );
}
