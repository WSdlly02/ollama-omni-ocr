import assert from "node:assert/strict";
import test from "node:test";
import { removeThinkingBlocks } from "../ocrTextFilter.ts";

test("preserves OCR whitespace outside reasoning blocks", () => {
  assert.equal(removeThinkingBlocks("  first line\nsecond line\n"), "  first line\nsecond line\n");
});

test("removes complete reasoning blocks", () => {
  assert.equal(
    removeThinkingBlocks("<think>private reasoning</think>Visible answer"),
    "Visible answer",
  );
});

test("suppresses unfinished reasoning blocks", () => {
  assert.equal(removeThinkingBlocks("Visible<think>still reasoning"), "Visible");
});

test("does not render a partial opening tag between stream chunks", () => {
  assert.equal(removeThinkingBlocks("Visible<thi"), "Visible");
  assert.equal(removeThinkingBlocks("Visible<thinker"), "Visible<thinker");
});

test("preserves ordinary angle-bracket text", () => {
  assert.equal(removeThinkingBlocks("1 < 2 and x <threshold>"), "1 < 2 and x <threshold>");
});

test("handles multiple reasoning blocks", () => {
  assert.equal(
    removeThinkingBlocks("A<think>one</think>B<think>two</think>C"),
    "ABC",
  );
});
