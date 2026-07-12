import type { Stroke } from "./strokeModel";

export const MAX_HISTORY_STEPS = 100;

export interface StrokeHistoryState {
  snapshots: Stroke[][];
  index: number;
}

export type StrokeHistoryAction =
  | { type: "commit"; strokes: Stroke[] }
  | { type: "undo" }
  | { type: "redo" };

export const createStrokeHistory = (): StrokeHistoryState => ({
  snapshots: [[]],
  index: 0,
});

export const strokeHistoryReducer = (
  state: StrokeHistoryState,
  action: StrokeHistoryAction,
): StrokeHistoryState => {
  if (action.type === "undo") {
    return state.index === 0 ? state : { ...state, index: state.index - 1 };
  }

  if (action.type === "redo") {
    return state.index >= state.snapshots.length - 1
      ? state
      : { ...state, index: state.index + 1 };
  }

  const branch = state.snapshots.slice(0, state.index + 1);
  branch.push([...action.strokes]);
  const snapshots = branch.slice(-MAX_HISTORY_STEPS);

  return {
    snapshots,
    index: snapshots.length - 1,
  };
};

export const getCurrentStrokes = (state: StrokeHistoryState): Stroke[] =>
  state.snapshots[state.index] ?? [];
