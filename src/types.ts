export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends Record<string, unknown>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type PathArray<P extends string> = P extends `${infer K}.${infer Rest}`
  ? [K, ...PathArray<Rest>]
  : [P];

export type PathKeys<T> =
  T extends Record<string, unknown>
    ? {
        [K in keyof T]: K extends string
          ? T[K] extends Record<string, unknown>
            ? K | `${K}.${PathKeys<T[K]>}`
            : K
          : never;
      }[keyof T]
    : never;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type SafePathOptions = {
  immutable?: boolean;
  cache?: boolean;
};

export type ValidatedSafePathOptions = SafePathOptions & {
  validate?: boolean;
  strict?: boolean;
};
