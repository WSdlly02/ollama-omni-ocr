export interface ResultContext {
  sourceRevision: number;
  style: string;
  mode: string;
  baseUrl: string;
  model: string;
}

interface CurrentRecognitionContext extends ResultContext {
  hasSource: boolean;
}

/**
 * Results are intentionally retained when input/configuration changes. This
 * predicate keeps that lazy-preservation policy honest by deciding when the UI
 * must label retained output as belonging to an earlier context.
 */
export const isResultContextStale = (
  resultContext: ResultContext | null,
  current: CurrentRecognitionContext,
): boolean => {
  if (!current.hasSource || !resultContext) return true;

  return (
    resultContext.sourceRevision !== current.sourceRevision ||
    resultContext.style !== current.style ||
    resultContext.mode !== current.mode ||
    resultContext.baseUrl !== current.baseUrl ||
    resultContext.model !== current.model
  );
};
