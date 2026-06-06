import { describe, expect, it } from 'vitest';
import { clearPathCache, safePath } from '../src';

describe('safePath', () => {
	const getTestObj = () => ({
		user: {
			name: 'John',
			age: 30,
			profile: {
				email: 'john@example.com',
				address: {
					city: 'Paris',
					country: 'France',
				},
			},
			hobbies: ['coding', 'reading'],
		},
		settings: {
			theme: 'dark',
			notifications: true,
		},
	});

	describe('get', () => {
		it('should get nested values with type safety', () => {
			const sp = safePath(getTestObj());

			expect(sp.get('user.name')).toBe('John');
			expect(sp.get('user.profile.address.city')).toBe('Paris');
			expect(sp.get('settings.theme')).toBe('dark');
		});

		it('should get array elements by numeric path', () => {
			const sp = safePath(getTestObj());

			expect(sp.get('user.hobbies.0')).toBe('coding');
			expect(sp.get('user.hobbies.1')).toBe('reading');
		});

		it('should return undefined for inherited properties', () => {
			const sp = safePath({ user: { name: 'John' } });

			// get must not walk the prototype chain (consistent with has)
			expect(sp.get('user.toString' as never)).toBeUndefined();
		});
	});

	describe('set', () => {
		it('should set nested values', () => {
			const obj = getTestObj();
			const sp = safePath(obj);

			sp.set('user.profile.address.city', 'Lyon');
			expect(obj.user.profile.address.city).toBe('Lyon');
		});

		it('should create missing intermediate objects', () => {
			type TestObj = { test: { deep: { nested: { value?: string } } } };
			const obj: TestObj = { test: { deep: { nested: {} } } };
			const sp = safePath(obj);

			const result = sp.set('test.deep.nested.value', 'success');

			expect(result).toBe(obj); // Should return the same object reference
			expect(obj.test.deep.nested.value).toBe('success');
		});

		it('should create arrays for numeric segments', () => {
			type TestObj = { list?: { name: string }[] };
			const obj: TestObj = {};
			const sp = safePath(obj);

			sp.set('list.0.name', 'first');

			expect(Array.isArray(obj.list)).toBe(true);
			expect(obj.list?.[0]?.name).toBe('first');
		});

		it('should set existing array elements in place', () => {
			const obj = getTestObj();
			const sp = safePath(obj);

			sp.set('user.hobbies.0', 'writing');

			expect(Array.isArray(obj.user.hobbies)).toBe(true);
			expect(obj.user.hobbies[0]).toBe('writing');
		});
	});

	describe('has', () => {
		it('should check if path exists', () => {
			const sp = safePath(getTestObj());

			expect(sp.has('user.profile.email')).toBe(true);
			expect(sp.has('user.profile.address.city')).toBe(true);
		});

		it('should not report inherited properties', () => {
			const sp = safePath({ user: { name: 'John' } });

			expect(sp.has('user.toString' as never)).toBe(false);
		});
	});

	describe('update', () => {
		it('should update values using a function', () => {
			const obj = getTestObj();
			const sp = safePath(obj);

			sp.update('user.age', (current) => (current || 0) + 1);
			expect(obj.user.age).toBe(31);
		});
	});

	describe('merge', () => {
		it('should deep merge partial objects', () => {
			const obj = getTestObj();
			const sp = safePath(obj);

			sp.merge({
				user: {
					profile: {
						address: {
							city: 'Marseille',
						},
					},
				},
			});

			expect(obj.user.profile.address.city).toBe('Marseille');
			expect(obj.user.profile.email).toBe('john@example.com'); // Unchanged
		});

		it('should preserve referential identity of merged sub-objects', () => {
			const obj = getTestObj();
			const profileRef = obj.user.profile;
			const settingsRef = obj.settings;
			const sp = safePath(obj);

			sp.merge({ user: { profile: { email: 'new@example.com' } } });

			// in-place merge must not replace existing sub-object references
			expect(obj.user.profile).toBe(profileRef);
			expect(obj.settings).toBe(settingsRef);
			expect(obj.user.profile.email).toBe('new@example.com');
		});
	});

	describe('immutable operations', () => {
		it('should not modify original object when immutable option is used', () => {
			const original = getTestObj();
			const sp = safePath(original);

			const result = sp.set('user.name', 'Jane', { immutable: true });

			expect(original.user.name).toBe('John'); // Original unchanged
			expect(result.user.name).toBe('Jane'); // New object has changes
		});

		it('should share untouched branches (structural sharing)', () => {
			const original = getTestObj();
			const sp = safePath(original);

			const result = sp.set('user.name', 'Jane', { immutable: true });

			// settings was not on the path: same reference
			expect(result.settings).toBe(original.settings);
			// user was on the path: new reference
			expect(result.user).not.toBe(original.user);
		});

		it('should support objects containing functions in immutable mode', () => {
			const original = { config: { level: 1 }, onChange: () => 'called' };
			const sp = safePath(original);

			// structuredClone would throw here — copy-on-write must not
			const result = sp.set('config.level', 2, { immutable: true });

			expect(original.config.level).toBe(1);
			expect(result.config.level).toBe(2);
			expect(result.onChange()).toBe('called');
		});

		it('should handle immutable delete operations', () => {
			type TestObj = {
				user: { name: string; tempProp?: string };
				other: { data: string };
			};
			const original: TestObj = {
				user: { name: 'Test', tempProp: 'delete-me' },
				other: { data: 'keep' },
			};
			const sp = safePath(original);

			const result = sp.delete('user.tempProp', { immutable: true });

			expect(original.user.tempProp).toBe('delete-me'); // Original unchanged
			expect(result).not.toBe(original); // Should be different object
			expect(result.user).toBeDefined();
			expect('tempProp' in result.user).toBe(false); // Property should not exist
			expect(result.other.data).toBe('keep'); // Other data preserved
			expect(result.other).toBe(original.other); // Untouched branch shared
		});

		it('should handle immutable merge with structural sharing', () => {
			const original = getTestObj();
			const sp = safePath(original);

			const result = sp.merge(
				{ settings: { theme: 'light' } },
				{ immutable: true }
			);

			expect(original.settings.theme).toBe('dark');
			expect(result.settings.theme).toBe('light');
			expect(result.user).toBe(original.user); // Untouched branch shared
		});
	});

	describe('performance optimizations', () => {
		it('should cache path parsing', () => {
			clearPathCache();
			const freshObj = {
				user: {
					profile: {
						address: {
							city: 'Paris',
						},
					},
				},
			};
			const sp = safePath(freshObj);

			// First access should parse and cache
			const value1 = sp.get('user.profile.address.city');
			// Second access should use cache
			const value2 = sp.get('user.profile.address.city');

			expect(value1).toBe(value2);
			expect(value1).toBe('Paris');
		});
	});

	describe('utility functions', () => {
		it('should validate paths correctly', () => {
			const sp = safePath(getTestObj());

			expect(sp.isValidPath('user.name')).toBe(true);
			expect(sp.isValidPath('user.invalid')).toBe(false);
			expect(sp.isValidPath('')).toBe(false);
		});

		it('should get all paths from object', () => {
			const sp = safePath(getTestObj());
			const paths = sp.getAllPaths();

			expect(paths).toContain('user');
			expect(paths).toContain('user.name');
			expect(paths).toContain('user.profile.address.city');
			expect(paths).toContain('settings.theme');
		});
	});

	describe('edge cases', () => {
		it('should handle null values in path', () => {
			type TestObj = { user: { profile: { email?: string } } };
			const obj: TestObj = { user: { profile: {} } };
			const sp = safePath(obj);

			sp.set('user.profile.email', 'test@example.com');
			expect(obj.user.profile.email).toBe('test@example.com');
		});

		it('should handle array values', () => {
			const sp = safePath(getTestObj());

			expect(sp.get('user.hobbies')).toEqual(['coding', 'reading']);
			expect(sp.has('user.hobbies')).toBe(true);
		});

		it('should handle undefined intermediate objects', () => {
			type TestObj = { deeply: { nested: { path?: string } } };
			const obj: TestObj = { deeply: { nested: {} } };
			const sp = safePath(obj);

			sp.set('deeply.nested.path', 'value');
			expect(obj.deeply.nested.path).toBe('value');
		});

		it('should delete array elements with splice semantics (no holes)', () => {
			const obj = getTestObj();
			const sp = safePath(obj);

			sp.delete('user.hobbies.0');

			expect(obj.user.hobbies).toEqual(['reading']);
			expect(obj.user.hobbies.length).toBe(1);
		});
	});
});
