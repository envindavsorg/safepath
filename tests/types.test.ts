import { describe, expect, it } from 'vitest';
import type { PathKeys, PathValue } from '../src';
import { safePath } from '../src';

/** Compile-time assertion helpers — failures surface in `pnpm typecheck`. */
type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;
type Expect<T extends true> = T;

// ── Interfaces are supported (used to resolve to `never`) ────────────────
interface IAddress {
	city: string;
	country: string;
}
interface IUser {
	name: string;
	address: IAddress;
}
export type interfaceCases = [
	Expect<
		Equal<
			PathKeys<IUser>,
			'name' | 'address' | 'address.city' | 'address.country'
		>
	>,
	Expect<Equal<PathValue<IUser, 'address.city'>, string>>,
];

// ── Optional properties stay addressable ─────────────────────────────────
type WithOptional = { user?: { name: string } };
export type optionalCases = [
	Expect<Equal<PathKeys<WithOptional>, 'user' | 'user.name'>>,
	Expect<Equal<PathValue<WithOptional, 'user.name'>, string>>,
];

// ── Arrays and tuples are addressable by index ───────────────────────────
type WithArray = { items: { id: number }[] };
type WithTuple = { pair: [string, number] };
export type arrayCases = [
	Expect<Equal<PathValue<WithArray, 'items.0.id'>, number>>,
	Expect<
		Equal<
			PathKeys<WithArray>,
			'items' | `items.${number}` | `items.${number}.id`
		>
	>,
	Expect<Equal<PathValue<WithTuple, 'pair.0'>, string>>,
	Expect<Equal<PathValue<WithTuple, 'pair.1'>, number>>,
];

// ── Unions of object types distribute ────────────────────────────────────
type WithUnion = { data: { a: number } | { b: string } };
export type unionCases = [
	Expect<Equal<PathValue<WithUnion, 'data.a'>, number>>,
	Expect<Equal<PathValue<WithUnion, 'data.b'>, string>>,
];

// ── Records traverse with dynamic segments ───────────────────────────────
type WithRecord = { dict: Record<string, { v: number }> };
export type recordCases = [
	Expect<Equal<PathValue<WithRecord, 'dict.anything.v'>, number>>,
];

// ── Built-in objects are leaves, not traversed ───────────────────────────
type WithDate = { createdAt: Date; pattern: RegExp };
export type leafCases = [
	Expect<Equal<PathKeys<WithDate>, 'createdAt' | 'pattern'>>,
];

// ── Deep nesting does not blow up the compiler ───────────────────────────
type Deep = {
	l1: {
		l2: { l3: { l4: { l5: { l6: { l7: { l8: { value: string } } } } } } };
	};
};
export type depthCases = [
	Expect<Equal<PathValue<Deep, 'l1.l2.l3.l4.l5.l6.l7.l8.value'>, string>>,
];

describe('type-level behavior (runtime smoke tests)', () => {
	it('rejects invalid paths and wrong value types at compile time', () => {
		const sp = safePath({ user: { name: 'John', age: 30 } });

		expect(sp.get('user.name')).toBe('John');

		// @ts-expect-error — 'user.invalid' is not a valid path
		sp.get('user.invalid');
		// @ts-expect-error — value type must match the path type
		sp.set('user.name', 123);
		// @ts-expect-error — 'user.name.length' goes through a leaf
		sp.get('user.name.length');
	});

	it('infers value types through interfaces at runtime', () => {
		const user: IUser = {
			name: 'John',
			address: { city: 'Paris', country: 'France' },
		};
		const sp = safePath(user);

		const city: string | undefined = sp.get('address.city');
		expect(city).toBe('Paris');
	});

	it('infers value types through arrays at runtime', () => {
		const data: WithArray = { items: [{ id: 1 }, { id: 2 }] };
		const sp = safePath(data);

		const id: number | undefined = sp.get('items.1.id');
		expect(id).toBe(2);
	});
});
