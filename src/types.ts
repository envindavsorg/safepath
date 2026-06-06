/**
 * Built-in types that path traversal treats as leaves: traversal never
 * descends into them and they never contribute nested path segments.
 */
type Leaf =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp
  | Error
  | Map<unknown, unknown>
  | Set<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | Promise<unknown>
  | ((...args: never[]) => unknown);

/**
 * Depth counter used to bound `PathKeys` recursion and avoid
 * "Type instantiation is excessively deep" (TS2589) on large types.
 * `Prev[10]` = 9, `Prev[0]` = never (stop).
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

/**
 * Union of every dot-notation path reachable in `T`, e.g.
 * `'user' | 'user.name' | 'items.${number}' | 'items.${number}.id'`.
 *
 * - Works with interfaces, type aliases, classes — anything `object`.
 * - Optional and nullable properties stay addressable (`NonNullable` traversal).
 * - Arrays expose numeric segments (`items.0.name`); tuples expose their exact indices.
 * - `Depth` (default 10) bounds recursion; raise it explicitly for deeper types.
 */
export type PathKeys<T, Depth extends number = 10> = [Depth] extends [never]
  ? never
  : T extends Leaf
    ? never
    : T extends readonly unknown[]
      ? number extends T["length"]
        ?
            | `${number}`
            | `${number}.${PathKeys<NonNullable<T[number]>, Prev[Depth]>}`
        : {
            [K in keyof T & `${number}`]:
              | K
              | `${K}.${PathKeys<NonNullable<T[K]>, Prev[Depth]>}`;
          }[keyof T & `${number}`]
      : T extends object
        ? {
            [K in keyof T & string]:
              | K
              | `${K}.${PathKeys<NonNullable<T[K]>, Prev[Depth]>}`;
          }[keyof T & string]
        : never;

/**
 * The type of the value at path `P` inside `T`.
 *
 * Tail-recursive (safe at 50+ levels), distributes over unions, traverses
 * optional properties via `NonNullable` (runtime `get` adds `| undefined`).
 */
export type PathValue<T, P extends string> = T extends object
  ? P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PathValue<NonNullable<T[K]>, Rest>
      : T extends readonly unknown[]
        ? K extends `${number}`
          ? PathValue<NonNullable<T[number]>, Rest>
          : never
        : never
    : P extends keyof T
      ? T[P]
      : T extends readonly unknown[]
        ? P extends `${number}`
          ? T[number]
          : never
        : never
  : never;

/**
 * Every path in `T` whose value is assignable to `V`. Handy for APIs that
 * only accept certain value types, e.g. a translation function that takes
 * `PathsTo<Config, string>` or a numeric form field bound to
 * `PathsTo<FormValues, number>`.
 */
export type PathsTo<T, V, Depth extends number = 10> = {
  [P in PathKeys<T, Depth>]: PathValue<T, P> extends V ? P : never;
}[PathKeys<T, Depth>];

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface SafePathOptions {
  immutable?: boolean;
}

export type ValidatedSafePathOptions = SafePathOptions & {
  strict?: boolean;
};
