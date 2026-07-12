import assert from "node:assert/strict";
import test from "node:test";
import {
  createModelNotFoundError,
  normalizeOllamaError,
} from "../ollamaErrors.ts";

const context = { model: "qwen3-vl", operation: "recognition" as const };

test("classifies browser network failures with an actionable message", () => {
  const error = normalizeOllamaError(new TypeError("Failed to fetch"), context);
  assert.equal(error.code, "connection");
  assert.match(error.message, /Cannot reach Ollama/);

  const sdkError = normalizeOllamaError(
    { name: "APIConnectionError", message: "Connection error." },
    context,
  );
  assert.equal(sdkError.code, "connection");
});

test("recognizes SDK timeout errors", () => {
  const error = normalizeOllamaError(
    { name: "APIConnectionTimeoutError", message: "Connection timed out." },
    context,
  );
  assert.equal(error.code, "timeout");
});

test("distinguishes a missing endpoint from a missing model", () => {
  const endpointError = normalizeOllamaError({ status: 404, message: "Not Found" }, context);
  assert.equal(endpointError.code, "endpoint_not_found");

  const modelError = normalizeOllamaError(
    { status: 404, message: "model qwen3-vl not found" },
    context,
  );
  assert.equal(modelError.code, "model_not_found");
  assert.match(modelError.message, /ollama pull qwen3-vl/);
});

test("classifies capacity and server failures", () => {
  assert.equal(normalizeOllamaError({ status: 413, message: "large" }, context).code, "request_too_large");
  assert.equal(normalizeOllamaError({ status: 429, message: "busy" }, context).code, "rate_limited");
  assert.equal(normalizeOllamaError({ status: 503, message: "down" }, context).code, "server");
});

test("keeps explicit missing-model errors intact", () => {
  const error = createModelNotFoundError("vision-model");
  assert.equal(normalizeOllamaError(error, context), error);
});
