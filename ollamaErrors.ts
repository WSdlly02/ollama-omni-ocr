export type OllamaErrorCode =
  | "cancelled"
  | "connection"
  | "timeout"
  | "model_not_found"
  | "endpoint_not_found"
  | "access_denied"
  | "request_too_large"
  | "rate_limited"
  | "server"
  | "unknown";

export class OllamaServiceError extends Error {
  public readonly code: OllamaErrorCode;

  constructor(
    code: OllamaErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "OllamaServiceError";
    this.code = code;
  }
}

interface ErrorContext {
  model: string;
  operation: "connection test" | "recognition";
}

const getErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
};

const getErrorName = (error: unknown): string => {
  if (error instanceof Error) return error.name;
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name;
  }
  return "";
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown error";
};

export const createModelNotFoundError = (model: string): OllamaServiceError =>
  new OllamaServiceError(
    "model_not_found",
    `Model "${model}" is not installed. Run: ollama pull ${model}`,
  );

export const normalizeOllamaError = (
  error: unknown,
  context: ErrorContext,
): OllamaServiceError => {
  if (error instanceof OllamaServiceError) return error;

  const status = getErrorStatus(error);
  const errorName = getErrorName(error);
  const originalMessage = getErrorMessage(error);
  const message = originalMessage.toLowerCase();

  if (
    (error instanceof DOMException && error.name === "AbortError") ||
    message.includes("aborted")
  ) {
    return new OllamaServiceError("cancelled", "Request cancelled.", { cause: error });
  }

  if (
    message.includes("model") &&
    (message.includes("not found") || message.includes("does not exist"))
  ) {
    return createModelNotFoundError(context.model);
  }

  if (
    errorName === "APIConnectionTimeoutError" ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return new OllamaServiceError(
      "timeout",
      `Ollama ${context.operation} timed out. The model may still be loading; try again.`,
      { cause: error },
    );
  }

  if (
    error instanceof TypeError ||
    errorName === "APIConnectionError" ||
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("networkerror") ||
    message === "connection error."
  ) {
    return new OllamaServiceError(
      "connection",
      "Cannot reach Ollama. Check that it is running and that the Base URL is reachable from this browser.",
      { cause: error },
    );
  }

  if (status === 404) {
    return new OllamaServiceError(
      "endpoint_not_found",
      "Ollama's OpenAI-compatible endpoint was not found. The Base URL should normally end in /v1.",
      { cause: error },
    );
  }

  if (status === 401 || status === 403) {
    return new OllamaServiceError(
      "access_denied",
      "Ollama rejected the request. Check proxy authentication and access rules.",
      { cause: error },
    );
  }

  if (status === 413) {
    return new OllamaServiceError(
      "request_too_large",
      "The image is too large for the configured proxy or Ollama server.",
      { cause: error },
    );
  }

  if (status === 429) {
    return new OllamaServiceError(
      "rate_limited",
      "Ollama is busy or its request queue is full. Wait briefly and retry.",
      { cause: error },
    );
  }

  if (status !== undefined && status >= 500) {
    return new OllamaServiceError(
      "server",
      "Ollama returned a server error. Check the Ollama logs and available memory.",
      { cause: error },
    );
  }

  return new OllamaServiceError(
    "unknown",
    `Ollama ${context.operation} failed: ${originalMessage}`,
    { cause: error },
  );
};
