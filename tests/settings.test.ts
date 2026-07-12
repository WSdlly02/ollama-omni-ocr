import assert from "node:assert/strict";
import test from "node:test";
import { parseStoredChoice } from "../preferences.ts";
import { validateOllamaSettings } from "../settings.ts";

test("settings validation trims values without rewriting the URL", () => {
  const result = validateOllamaSettings({
    baseUrl: "  http://localhost:11434/v1/  ",
    model: "  qwen3-vl  ",
    theme: "system",
  });

  assert.deepEqual(result.value, {
    baseUrl: "http://localhost:11434/v1/",
    model: "qwen3-vl",
    theme: "system",
  });
});

test("settings validation accepts a same-origin proxy path", () => {
  const result = validateOllamaSettings({
    baseUrl: "/ollama/v1",
    model: "vision-model",
    theme: "dark",
  });
  assert.equal(result.value?.baseUrl, "/ollama/v1");
});

test("settings validation rejects unsafe protocols and empty model names", () => {
  const result = validateOllamaSettings({
    baseUrl: "file:///tmp/ollama",
    model: "  ",
    theme: "light",
  });
  assert.equal(result.value, null);
  assert.ok(result.errors.baseUrl);
  assert.ok(result.errors.model);
});

test("stored choices fall back instead of trusting stale values", () => {
  assert.equal(parseStoredChoice("dark", ["light", "dark"] as const, "light"), "dark");
  assert.equal(parseStoredChoice("sepia", ["light", "dark"] as const, "light"), "light");
  assert.equal(parseStoredChoice(null, ["light", "dark"] as const, "light"), "light");
});
