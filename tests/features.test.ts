import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { PathsTo } from '../src';
import { getValueByPath, safePath } from '../src';

/** Compile-time assertion helpers — failures surface in `pnpm typecheck`. */
type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false;
type Expect<T extends true> = T;

describe('get with default value', () => {
	type TestObj = {
		user: { name: string; nickname?: string };
	};
	const getTestObj = (): TestObj => ({ user: { name: 'John' } });

	it('should return the value when present', () => {
		const sp = safePath(getTestObj());

		expect(sp.get('user.name', 'fallback')).toBe('John');
	});

	it('should return the default when the value is missing', () => {
		const sp = safePath(getTestObj());

		expect(sp.get('user.nickname', 'Johnny')).toBe('Johnny');
	});

	it('should preserve falsy values (only undefined triggers the default)', () => {
		const sp = safePath({ count: 0, label: '', flag: false });

		expect(sp.get('count', 99)).toBe(0);
		expect(sp.get('label', 'x')).toBe('');
		expect(sp.get('flag', true)).toBe(false);
	});

	it('should work on the standalone function', () => {
		const obj = getTestObj();

		expect(getValueByPath(obj, 'user.nickname', 'Johnny')).toBe('Johnny');
		expect(getValueByPath(obj, 'user.name')).toBe('John');
	});
});

describe('pick', () => {
	const getTestObj = () => ({
		user: {
			name: 'John',
			age: 30,
			profile: { email: 'john@example.com' },
		},
		settings: { theme: 'dark' },
	});

	it('should extract several paths into a flat typed object', () => {
		const sp = safePath(getTestObj());

		const picked = sp.pick([
			'user.name',
			'user.profile.email',
			'settings.theme',
		]);

		expect(picked).toEqual({
			'user.name': 'John',
			'user.profile.email': 'john@example.com',
			'settings.theme': 'dark',
		});
	});

	it('should return undefined for missing optional values', () => {
		type TestObj = { a: { b?: string }; c: number };
		const sp = safePath({ a: {}, c: 1 } as TestObj);

		const picked = sp.pick(['a.b', 'c']);

		expect(picked['a.b']).toBeUndefined();
		expect(picked.c).toBe(1);
	});
});

describe('validateAll', () => {
	const getTestObj = () => ({
		user: {
			name: 'John',
			age: 30,
			email: 'john@example.com',
		},
	});

	it('should succeed when every path passes its schema', () => {
		const sp = safePath(getTestObj());

		const result = sp.validateAll({
			'user.name': z.string().min(2),
			'user.age': z.number().min(0),
			'user.email': z.string().email(),
		});

		expect(result.success).toBe(true);
		expect(result.issues).toEqual({});
	});

	it('should aggregate issues keyed by failing path', () => {
		const sp = safePath(getTestObj());

		const result = sp.validateAll({
			'user.name': z.string().min(50),
			'user.age': z.number().max(10),
			'user.email': z.string().email(),
		});

		expect(result.success).toBe(false);
		expect(Object.keys(result.issues).sort()).toEqual([
			'user.age',
			'user.name',
		]);
		expect(result.issues['user.name']?.length).toBeGreaterThan(0);
		expect(result.issues['user.email']).toBeUndefined();
	});

	it('should mix validators from different libraries', () => {
		const sp = safePath(getTestObj());

		const result = sp.validateAll({
			'user.name': z.string().min(2),
			'user.age': v.pipe(v.number(), v.minValue(0)),
		});

		expect(result.success).toBe(true);
	});
});

// ── PathsTo: paths whose value matches a type ────────────────────────────
type Form = {
	title: string;
	count: number;
	author: { name: string; age: number };
};
export type pathsToCases = [
	Expect<Equal<PathsTo<Form, string>, 'title' | 'author.name'>>,
	Expect<Equal<PathsTo<Form, number>, 'count' | 'author.age'>>,
];

describe('PathsTo (runtime smoke test)', () => {
	it('should accept only paths leading to the requested type', () => {
		const form: Form = {
			title: 'Hello',
			count: 1,
			author: { name: 'John', age: 30 },
		};
		const readString = (path: PathsTo<Form, string>): string | undefined =>
			safePath(form).get(path) as string | undefined;

		expect(readString('title')).toBe('Hello');
		expect(readString('author.name')).toBe('John');

		// @ts-expect-error — 'count' leads to a number, not a string
		readString('count');
	});
});
