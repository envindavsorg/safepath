import { describe, expect, it } from 'vitest';
import { safePath } from '../src';

describe('prototype pollution protection', () => {
	it('should throw when setting through __proto__', () => {
		const sp = safePath({} as Record<string, unknown>);

		expect(() =>
			sp.set('__proto__.isAdmin' as never, true as never)
		).toThrow(TypeError);
		// the global Object.prototype must be intact
		expect(({} as { isAdmin?: boolean }).isAdmin).toBeUndefined();
	});

	it('should throw when setting through constructor or prototype', () => {
		const sp = safePath({} as Record<string, unknown>);

		expect(() =>
			sp.set('constructor.prototype.isAdmin' as never, true as never)
		).toThrow(TypeError);
		expect(() =>
			sp.set('prototype.polluted' as never, true as never)
		).toThrow(TypeError);
		expect(({} as { isAdmin?: boolean }).isAdmin).toBeUndefined();
	});

	it('should throw when deleting through __proto__', () => {
		const sp = safePath({} as Record<string, unknown>);

		expect(() => sp.delete('__proto__.toString' as never)).toThrow(
			TypeError
		);
		expect({}.toString).toBeDefined();
	});

	it('should treat forbidden keys as absent on read', () => {
		const sp = safePath({} as Record<string, unknown>);

		expect(sp.get('__proto__' as never)).toBeUndefined();
		expect(sp.get('constructor' as never)).toBeUndefined();
		expect(sp.has('__proto__' as never)).toBe(false);
	});

	it('should skip forbidden keys during merge', () => {
		const obj: Record<string, unknown> = { safe: 1 };
		const sp = safePath(obj);
		// simulate a malicious payload, e.g. from JSON.parse
		const payload = JSON.parse(
			'{"safe": 2, "__proto__": {"polluted": true}}'
		) as Record<string, unknown>;

		sp.merge(payload);

		expect(obj['safe']).toBe(2);
		expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
		expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
	});
});
