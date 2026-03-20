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
};

export type ValidatedSafePathOptions = SafePathOptions & {
	strict?: boolean;
};
