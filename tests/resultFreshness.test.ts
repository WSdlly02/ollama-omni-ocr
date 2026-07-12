import assert from "node:assert/strict";
import test from "node:test";
import { isResultContextStale, type ResultContext } from "../resultFreshness.ts";

const resultContext: ResultContext = {
  sourceRevision: 3,
  style: "md",
  mode: "strict",
  baseUrl: "/ollama/v1",
  model: "vision-model",
};

test("kept output stays fresh only for the context that produced it", () => {
  assert.equal(
    isResultContextStale(resultContext, { ...resultContext, hasSource: true }),
    false,
  );
});

test("changing the source marks retained output as stale without deleting it", () => {
  assert.equal(
    isResultContextStale(resultContext, {
      ...resultContext,
      sourceRevision: 4,
      hasSource: true,
    }),
    true,
  );
});

test("changing recognition configuration marks retained output as stale", () => {
  assert.equal(
    isResultContextStale(resultContext, {
      ...resultContext,
      mode: "enhance",
      hasSource: true,
    }),
    true,
  );
});

test("clearing the source keeps but invalidates the previous output", () => {
  assert.equal(
    isResultContextStale(resultContext, { ...resultContext, hasSource: false }),
    true,
  );
});
