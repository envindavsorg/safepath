import type { StandardSchemaV1 } from "./standard-schema";
import { PathValidationError, validateSync } from "./standard-schema";
import type {
  DeepPartial,
  PathKeys,
  PathValue,
  SafePathOptions,
  ValidatedSafePathOptions,
} from "./types";
import {
  deletePath,
  getAllPaths,
  getValueByPath,
  hasPath,
  isUnsafeKey,
  isValidPath,
  setValueByPath,
} from "./utils";

/** One Standard Schema per path, for `validateAll`. */
export type PathSchemas<T extends object> = {
  [P in PathKeys<T>]?: StandardSchemaV1;
};

/** Aggregated result of `validateAll`: issues keyed by failing path. */
export interface PathsValidationResult {
  issues: Partial<Record<string, ReadonlyArray<StandardSchemaV1.Issue>>>;
  success: boolean;
}

export interface SafePath<T extends object> {
  delete<P extends PathKeys<T>>(path: P, options?: SafePathOptions): T;
  get<P extends PathKeys<T>>(path: P): PathValue<T, P> | undefined;
  get<P extends PathKeys<T>, D>(path: P, defaultValue: D): PathValue<T, P> | D;
  getAllPaths(): PathKeys<T>[];
  has<P extends PathKeys<T>>(path: P): boolean;
  isValidPath(path: string): path is PathKeys<T>;
  merge(partial: DeepPartial<T>, options?: SafePathOptions): T;
  /** Extracts several paths at once into a flat, fully typed object. */
  pick<P extends PathKeys<T>>(
    paths: readonly P[]
  ): { [K in P]: PathValue<T, K> | undefined };
  set<P extends PathKeys<T>>(
    path: P,
    value: PathValue<T, P>,
    options?: SafePathOptions
  ): T;
  update<P extends PathKeys<T>>(
    path: P,
    updater: (current: PathValue<T, P> | undefined) => PathValue<T, P>,
    options?: SafePathOptions
  ): T;
  /**
   * Validates the value at `path` with any Standard Schema validator
   * (Zod 3.24+, Valibot v1+, ArkType 2+, Effect Schema, …).
   * Throws if the schema validates asynchronously — use `validateAsync`.
   */
  validate<P extends PathKeys<T>, Schema extends StandardSchemaV1>(
    path: P,
    schema: Schema
  ): StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>;
  /**
   * Validates several paths in one call, each against its own Standard
   * Schema. Returns an aggregated result with issues keyed by path —
   * ideal for validating a form or a config object field by field.
   */
  validateAll(schemas: PathSchemas<T>): PathsValidationResult;
  /**
   * Validates `value` with the schema, then sets the validated output at
   * `path`. Throws `PathValidationError` on failure unless
   * `{ strict: false }`, in which case the object is returned unchanged.
   */
  validateAndSet<
    P extends PathKeys<T>,
    Schema extends StandardSchemaV1<unknown, PathValue<T, P>>,
  >(
    path: P,
    value: unknown,
    schema: Schema,
    options?: ValidatedSafePathOptions
  ): T;
  validateAndSetAsync<
    P extends PathKeys<T>,
    Schema extends StandardSchemaV1<unknown, PathValue<T, P>>,
  >(
    path: P,
    value: unknown,
    schema: Schema,
    options?: ValidatedSafePathOptions
  ): Promise<T>;
  validateAsync<P extends PathKeys<T>, Schema extends StandardSchemaV1>(
    path: P,
    schema: Schema
  ): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>>;
}

export const safePath = <T extends object>(
  obj: T,
  defaultOptions?: SafePathOptions
): SafePath<T> => ({
  get<P extends PathKeys<T>, D = undefined>(
    path: P,
    defaultValue?: D
  ): PathValue<T, P> | D {
    return getValueByPath(obj, path, defaultValue as D);
  },

  set<P extends PathKeys<T>>(
    path: P,
    value: PathValue<T, P>,
    options?: SafePathOptions
  ): T {
    const opts = { ...defaultOptions, ...options };
    return setValueByPath(obj, path, value, opts);
  },

  has<P extends PathKeys<T>>(path: P): boolean {
    return hasPath(obj, path);
  },

  delete<P extends PathKeys<T>>(path: P, options?: SafePathOptions): T {
    const opts = { ...defaultOptions, ...options };
    return deletePath(obj, path, opts);
  },

  update<P extends PathKeys<T>>(
    path: P,
    updater: (current: PathValue<T, P> | undefined) => PathValue<T, P>,
    options?: SafePathOptions
  ): T {
    const currentValue = getValueByPath(obj, path);
    const newValue = updater(currentValue);
    return this.set(path, newValue, options);
  },

  merge(partial: DeepPartial<T>, options?: SafePathOptions): T {
    const opts = { ...defaultOptions, ...options };
    if (opts?.immutable) {
      return deepMergeCopy(
        obj as Record<string, unknown>,
        partial as Record<string, unknown>
      ) as T;
    }
    deepMergeInto(
      obj as Record<string, unknown>,
      partial as Record<string, unknown>
    );
    return obj;
  },

  pick<P extends PathKeys<T>>(
    paths: readonly P[]
  ): { [K in P]: PathValue<T, K> | undefined } {
    const result: Record<string, unknown> = {};
    for (const path of paths) {
      result[path] = getValueByPath(obj, path);
    }
    return result as { [K in P]: PathValue<T, K> | undefined };
  },

  getAllPaths(): PathKeys<T>[] {
    return getAllPaths(obj);
  },

  isValidPath(path: string): path is PathKeys<T> {
    return isValidPath(obj, path);
  },

  validateAll(schemas: PathSchemas<T>): PathsValidationResult {
    const issues: Record<string, ReadonlyArray<StandardSchemaV1.Issue>> = {};
    let success = true;

    for (const [path, schema] of Object.entries(schemas) as Array<
      [PathKeys<T>, StandardSchemaV1 | undefined]
    >) {
      if (!schema) {
        continue;
      }
      const result = validateSync(schema, getValueByPath(obj, path));
      if (result.issues) {
        success = false;
        issues[path] = result.issues;
      }
    }

    return { success, issues };
  },

  validate<P extends PathKeys<T>, Schema extends StandardSchemaV1>(
    path: P,
    schema: Schema
  ): StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>> {
    return validateSync(schema, getValueByPath(obj, path));
  },

  async validateAsync<P extends PathKeys<T>, Schema extends StandardSchemaV1>(
    path: P,
    schema: Schema
  ): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>> {
    return (await schema["~standard"].validate(
      getValueByPath(obj, path)
    )) as StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>;
  },

  validateAndSet<
    P extends PathKeys<T>,
    Schema extends StandardSchemaV1<unknown, PathValue<T, P>>,
  >(
    path: P,
    value: unknown,
    schema: Schema,
    options?: ValidatedSafePathOptions
  ): T {
    const result = validateSync(schema, value);

    if (result.issues) {
      if (options?.strict !== false) {
        throw new PathValidationError(path, result.issues);
      }
      return obj;
    }

    return this.set(path, result.value as PathValue<T, P>, options);
  },

  async validateAndSetAsync<
    P extends PathKeys<T>,
    Schema extends StandardSchemaV1<unknown, PathValue<T, P>>,
  >(
    path: P,
    value: unknown,
    schema: Schema,
    options?: ValidatedSafePathOptions
  ): Promise<T> {
    const result = await schema["~standard"].validate(value);

    if (result.issues) {
      if (options?.strict !== false) {
        throw new PathValidationError(path, result.issues);
      }
      return obj;
    }

    return this.set(path, result.value as PathValue<T, P>, options);
  },
});

const isMergeableObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Merges `source` into `target` in place, preserving the referential
 * identity of every sub-object that already exists in `target`.
 */
const deepMergeInto = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): void => {
  for (const key in source) {
    if (!Object.hasOwn(source, key) || isUnsafeKey(key)) {
      continue;
    }
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isMergeableObject(sourceValue) && isMergeableObject(targetValue)) {
      deepMergeInto(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      target[key] = sourceValue;
    }
  }
};

/**
 * Returns a new object with `source` merged over `target`. Untouched
 * branches are shared structurally with `target` (no full deep clone).
 */
const deepMergeCopy = (
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...target };

  for (const key in source) {
    if (!Object.hasOwn(source, key) || isUnsafeKey(key)) {
      continue;
    }
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isMergeableObject(sourceValue) && isMergeableObject(targetValue)) {
      result[key] = deepMergeCopy(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
};

export type { StandardSchemaV1 } from "./standard-schema";
export { PathValidationError, validateSync } from "./standard-schema";
export type {
  DeepPartial,
  PathKeys,
  PathsTo,
  PathValue,
  SafePathOptions,
  ValidatedSafePathOptions,
} from "./types";

export {
  clearPathCache,
  deletePath,
  getAllPaths,
  getValueByPath,
  hasPath,
  isValidPath,
  setValueByPath,
} from "./utils";
