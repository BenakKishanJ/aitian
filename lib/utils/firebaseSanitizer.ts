/**
 * Utility to sanitize data for Firebase
 * Removes undefined values and converts them to null
 */
export function sanitizeForFirebase<T extends Record<string, any>>(
  data: T
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      // Skip undefined values or convert to null based on preference
      // Here we skip them to avoid storing nulls unnecessarily
      continue;
    } else if (value === null) {
      sanitized[key] = null;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeForFirebase(item)
          : item
      );
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeForFirebase(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Remove undefined values from an object recursively
 * This ensures Firebase won't throw errors
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      cleaned[key] = removeUndefined(value);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Convert undefined values to null
 * Firebase accepts null but not undefined
 */
export function undefinedToNull<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      result[key] = null;
    } else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = undefinedToNull(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export default {
  sanitizeForFirebase,
  removeUndefined,
  undefinedToNull,
};
