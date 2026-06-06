import type {
  PathKeys,
  PathValue,
  SafePathOptions,
  WildcardPathKeys,
  WildcardPathValue,
} from "./types";

const pathCache = new Map<string, readonly string[]>();
const MAX_CACHE_SIZE = 1000;

/**
 * Keys that would let a path reach `Object.prototype` (prototype pollution).
 * Write operations throw on them; read operations treat them as absent.
 */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const parsePath = (path: string): readonly string[] => {
  const cached = pathCache.get(path);
  if (cached) {
    return cached;
  }

  const keys = path.split(".");

  if (pathCache.size >= MAX_CACHE_SIZE) {
    const firstKey = pathCache.keys().next().value;
    if (firstKey !== undefined) {
      pathCache.delete(firstKey);
    }
  }

  pathCache.set(path, keys);
  return keys;
};

/** True for keys that must never be written through (prototype pollution). */
export const isUnsafeKey = (key: string): boolean => FORBIDDEN_KEYS.has(key);

const assertSafeKeys = (keys: readonly string[], path: string): void => {
  for (const key of keys) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new TypeError(
        `Unsafe path segment "${key}" in path "${path}": writing through it would reach the prototype chain`
      );
    }
  }
};

const INDEX_KEY_PATTERN = /^\d+$/;

const isIndexKey = (key: string): boolean => INDEX_KEY_PATTERN.test(key);

/** Shallow-clones a single node, preserving array-ness (copy-on-write step). */
const cloneNode = (value: unknown): Record<string, unknown> | unknown[] =>
  Array.isArray(value) ? [...value] : { ...(value as object) };

export const getValueByPath = <
  T extends object,
  P extends PathKeys<T>,
  D = undefined,
>(
  obj: T,
  path: P,
  defaultValue?: D
): PathValue<T, P> | D => {
  const keys = parsePath(path as string);
  let result: unknown = obj;

  for (const key of keys) {
    if (
      result == null ||
      typeof result !== "object" ||
      FORBIDDEN_KEYS.has(key) ||
      !Object.hasOwn(result, key)
    ) {
      return defaultValue as D;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as PathValue<T, P> | D;
};

export const setValueByPath = <T extends object, P extends PathKeys<T>>(
  obj: T,
  path: P,
  value: PathValue<T, P>,
  options?: SafePathOptions
): T => {
  const keys = parsePath(path as string);
  assertSafeKeys(keys, path as string);
  const lastKey = keys.at(-1);
  if (!lastKey) {
    return obj;
  }

  const target = options?.immutable ? (cloneNode(obj) as T) : obj;
  let current = target as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) {
      continue;
    }

    const existing = current[key];
    if (
      !Object.hasOwn(current, key) ||
      existing === null ||
      typeof existing !== "object"
    ) {
      // Create the missing node: an array when the next segment is a
      // numeric index, a plain object otherwise.
      const nextKey = keys[i + 1];
      current[key] = nextKey !== undefined && isIndexKey(nextKey) ? [] : {};
    } else if (options?.immutable) {
      // Copy-on-write: only the nodes along the path are cloned, the
      // rest of the structure is shared with the original.
      current[key] = cloneNode(existing);
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
  return target;
};

const collectMatches = (
  node: unknown,
  keys: readonly string[],
  index: number,
  out: unknown[]
): void => {
  if (index === keys.length) {
    out.push(node);
    return;
  }
  if (node === null || typeof node !== "object") {
    return;
  }

  const key = keys[index];
  if (key === undefined || key === "") {
    return;
  }

  if (key === "*") {
    // Own enumerable values only — same safety contract as get.
    const values = Array.isArray(node) ? node : Object.values(node);
    for (const value of values) {
      collectMatches(value, keys, index + 1, out);
    }
    return;
  }

  if (FORBIDDEN_KEYS.has(key) || !Object.hasOwn(node, key)) {
    return;
  }
  collectMatches((node as Record<string, unknown>)[key], keys, index + 1, out);
};

/**
 * Resolves a wildcard path (`'users.*.name'`) and returns every matched
 * value, flattened across `*` expansions. Paths without `*` behave like
 * `getValueByPath` but always return an array (0 or 1 element).
 */
export const getManyByPath = <T extends object, P extends WildcardPathKeys<T>>(
  obj: T,
  path: P
): WildcardPathValue<T, P>[] => {
  const keys = parsePath(path as string);
  const out: unknown[] = [];
  collectMatches(obj, keys, 0, out);
  return out as WildcardPathValue<T, P>[];
};

export const hasPath = <T extends object, P extends PathKeys<T>>(
  obj: T,
  path: P
): boolean => {
  const keys = parsePath(path as string);
  let current: unknown = obj;

  for (const key of keys) {
    if (
      !key ||
      current == null ||
      typeof current !== "object" ||
      !Object.hasOwn(current, key)
    ) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return true;
};

export const deletePath = <T extends object, P extends PathKeys<T>>(
  obj: T,
  path: P,
  options?: SafePathOptions
): T => {
  const keys = parsePath(path as string);
  assertSafeKeys(keys, path as string);
  const lastKey = keys.at(-1);
  if (!(lastKey && hasPath(obj, path))) {
    return obj;
  }

  const target = options?.immutable ? (cloneNode(obj) as T) : obj;
  let current = target as Record<string, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key && Object.hasOwn(current, key)) ||
      current[key] === null ||
      typeof current[key] !== "object"
    ) {
      return target;
    }
    if (options?.immutable) {
      current[key] = cloneNode(current[key]);
    }
    current = current[key] as Record<string, unknown>;
  }

  if (Array.isArray(current) && isIndexKey(lastKey)) {
    current.splice(Number(lastKey), 1);
  } else {
    delete current[lastKey];
  }

  return target;
};

export const isValidPath = <T extends object>(
  obj: T,
  path: string
): path is PathKeys<T> =>
  typeof path === "string" &&
  path.length > 0 &&
  hasPath(obj, path as PathKeys<T>);

interface PathStackItem {
  node: unknown;
  prefix: string;
}

const collectOwnPaths = (
  item: PathStackItem,
  paths: string[],
  stack: PathStackItem[]
): void => {
  const { node, prefix } = item;
  if (!node || typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;
  for (const key in record) {
    if (!Object.hasOwn(record, key)) {
      continue;
    }
    const newPath = prefix ? `${prefix}.${key}` : key;
    paths.push(newPath);

    const val = record[key];
    if (val != null && typeof val === "object") {
      stack.push({ node: val, prefix: newPath });
    }
  }
};

export const getAllPaths = <T extends object>(
  obj: T,
  prefix = ""
): PathKeys<T>[] => {
  const paths: string[] = [];
  const stack: PathStackItem[] = [{ node: obj, prefix }];

  let item = stack.pop();
  while (item) {
    collectOwnPaths(item, paths, stack);
    item = stack.pop();
  }

  return paths as PathKeys<T>[];
};

export const clearPathCache = (): void => {
  pathCache.clear();
};
