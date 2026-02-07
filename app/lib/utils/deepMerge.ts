/**
 * Simple deep merge for objects.
 * Used by generated spec files to reconstruct merged specs at runtime.
 */
export function deepMerge<T extends object, U extends object>(target: T, source: U): T & U {
  const result = { ...target } as any;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = (source as any)[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result as T & U;
}
