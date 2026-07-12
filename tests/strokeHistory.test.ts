import assert from "node:assert/strict";
import test from "node:test";
import {
  createStrokeHistory,
  getCurrentStrokes,
  MAX_HISTORY_STEPS,
  strokeHistoryReducer,
} from "../components/handwriting/strokeHistory.ts";
import {
  createPenStroke,
  eraseStrokesAtPoint,
} from "../components/handwriting/strokeModel.ts";

const stroke = (x: number) => createPenStroke({ x, y: 10 }, "#000000", 2);

test("undo followed by commit creates a new branch", () => {
  let state = createStrokeHistory();
  state = strokeHistoryReducer(state, { type: "commit", strokes: [stroke(1)] });
  state = strokeHistoryReducer(state, { type: "commit", strokes: [stroke(1), stroke(2)] });
  state = strokeHistoryReducer(state, { type: "undo" });
  state = strokeHistoryReducer(state, { type: "commit", strokes: [stroke(3)] });

  assert.deepEqual(getCurrentStrokes(state).map((item) => item.minX), [3]);
  assert.equal(state.snapshots.length, 3);
  assert.equal(strokeHistoryReducer(state, { type: "redo" }), state);
});

test("history is capped without breaking the current index", () => {
  let state = createStrokeHistory();
  for (let index = 0; index < MAX_HISTORY_STEPS + 20; index += 1) {
    state = strokeHistoryReducer(state, { type: "commit", strokes: [stroke(index)] });
  }

  assert.equal(state.snapshots.length, MAX_HISTORY_STEPS);
  assert.equal(state.index, MAX_HISTORY_STEPS - 1);
  assert.equal(getCurrentStrokes(state)[0]?.minX, MAX_HISTORY_STEPS + 19);
});

test("eraser preserves array identity when it misses and removes a hit stroke", () => {
  const strokes = [stroke(10), stroke(50)];
  assert.equal(eraseStrokesAtPoint(strokes, { x: 100, y: 100 }, 4), strokes);

  const erased = eraseStrokesAtPoint(strokes, { x: 10, y: 10 }, 4);
  assert.deepEqual(erased.map((item) => item.minX), [50]);
});

test("a continuous eraser preview is committed as one undoable history step", () => {
  const original = [stroke(10), stroke(20), stroke(30)];
  let state = strokeHistoryReducer(createStrokeHistory(), {
    type: "commit",
    strokes: original,
  });

  let preview = eraseStrokesAtPoint(original, { x: 10, y: 10 }, 4);
  preview = eraseStrokesAtPoint(preview, { x: 20, y: 10 }, 4);
  state = strokeHistoryReducer(state, { type: "commit", strokes: preview });

  assert.equal(state.snapshots.length, 3);
  assert.deepEqual(getCurrentStrokes(state).map((item) => item.minX), [30]);
  assert.deepEqual(
    getCurrentStrokes(strokeHistoryReducer(state, { type: "undo" })).map((item) => item.minX),
    [10, 20, 30],
  );
});
