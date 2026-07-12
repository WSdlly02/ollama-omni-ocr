export const parseStoredChoice = <Value extends string>(
  storedValue: string | null,
  allowedValues: readonly Value[],
  fallback: Value,
): Value =>
  storedValue !== null && allowedValues.includes(storedValue as Value)
    ? (storedValue as Value)
    : fallback;
