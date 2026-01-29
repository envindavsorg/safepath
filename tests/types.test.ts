import { safePath } from '../src';

describe('Type Safety and Autocompletion Tests', () => {
	const testObj = {
		user: {
			name: 'John',
			age: 30,
			profile: {
				email: 'john@example.com',
				address: {
					city: 'Paris',
					country: 'France',
					coordinates: {
						lat: 48.8566,
						lng: 2.3522,
					},
				},
			},
			preferences: {
				theme: 'dark' as const,
				notifications: true,
			},
		},
		settings: {
			language: 'fr',
			version: '1.0.0',
		},
		metadata: {
			createdAt: new Date(),
			tags: ['important', 'user'],
		},
	};

	it('should provide correct type inference for get operations', () => {
		const sp = safePath(testObj);

		const name = sp.get('user.name');
		expect(typeof name).toBe('string');

		const age = sp.get('user.age');
		expect(typeof age).toBe('number');

		const city = sp.get('user.profile.address.city');
		expect(typeof city).toBe('string');

		const lat = sp.get('user.profile.address.coordinates.lat');
		expect(typeof lat).toBe('number');

		const theme = sp.get('user.preferences.theme');
		expect(theme).toBe('dark');

		const notifications = sp.get('user.preferences.notifications');
		expect(typeof notifications).toBe('boolean');

		const tags = sp.get('metadata.tags');
		expect(Array.isArray(tags)).toBe(true);

		const createdAt = sp.get('metadata.createdAt');
		expect(createdAt instanceof Date).toBe(true);
	});

	it('should provide correct type inference for set operations', () => {
		const sp = safePath(testObj);

		const result1 = sp.set('user.name', 'Jane');
		expect(result1).toBe(testObj);

		const result2 = sp.set('user.profile.address.city', 'Lyon');
		expect(result2).toBe(testObj);

		const result3 = sp.set('user.preferences.theme', 'dark');
		expect(result3).toBe(testObj);
	});

	it('should provide correct type inference for has operations', () => {
		const sp = safePath(testObj);

		const hasName = sp.has('user.name');
		expect(typeof hasName).toBe('boolean');

		const hasDeepPath = sp.has('user.profile.address.city');
		expect(typeof hasDeepPath).toBe('boolean');
	});

	it('should provide correct type inference for update operations', () => {
		const sp = safePath(testObj);

		const result = sp.update('user.age', (current) => {
			expect(typeof current).toBe('number');
			return (current || 0) + 1;
		});
		expect(result).toBe(testObj);
	});

	it('should provide type-safe path validation', () => {
		const sp = safePath(testObj);

		sp.get('user.name');
		sp.get('user.profile.email');
		sp.get('user.profile.address.city');
		sp.get('user.profile.address.coordinates.lat');
		sp.get('settings.language');
		sp.get('metadata.tags');

		expect(typeof sp.get).toBe('function');
		expect(typeof sp.set).toBe('function');
		expect(typeof sp.has).toBe('function');
		expect(typeof sp.delete).toBe('function');
		expect(typeof sp.update).toBe('function');
		expect(typeof sp.merge).toBe('function');
		expect(typeof sp.getAllPaths).toBe('function');
		expect(typeof sp.isValidPath).toBe('function');
	});

	it('should handle complex nested objects with proper typing', () => {
		const complexObj = {
			api: {
				endpoints: {
					users: {
						create: '/api/users',
						read: '/api/users/:id',
						update: '/api/users/:id',
						delete: '/api/users/:id',
					},
					posts: {
						create: '/api/posts',
						list: '/api/posts',
					},
				},
				config: {
					timeout: 5000,
					retries: 3,
					headers: {
						'Content-Type': 'application/json',
						Authorization: 'Bearer token',
					},
				},
			},
		};

		const sp = safePath(complexObj);

		const createEndpoint = sp.get('api.endpoints.users.create');
		expect(typeof createEndpoint).toBe('string');

		const timeout = sp.get('api.config.timeout');
		expect(typeof timeout).toBe('number');

		const contentType = sp.get('api.config.headers.Content-Type');
		expect(typeof contentType).toBe('string');

		expect(createEndpoint).toBe('/api/users');
		expect(timeout).toBe(5000);
		expect(contentType).toBe('application/json');
	});
});

it('should compile without TypeScript errors', () => {
	const localTestObj = {
		user: {
			name: 'John',
			age: 30,
			profile: {
				email: 'john@example.com',
				address: {
					city: 'Paris',
				},
			},
			preferences: {
				theme: 'dark' as const,
				notifications: true,
			},
		},
		metadata: {
			tags: ['important'],
		},
	};
	const sp = safePath(localTestObj);

	sp.get('user.name');
	sp.get('user.age');
	sp.get('user.profile.email');
	sp.get('user.profile.address.city');
	sp.get('user.preferences.theme');
	sp.get('user.preferences.notifications');
	sp.get('metadata.tags');

	sp.set('user.name', 'Jane');
	sp.set('user.age', 25);
	sp.set('user.profile.email', 'jane@example.com');
	sp.set('user.preferences.theme', 'dark');
	sp.set('user.preferences.notifications', false);

	sp.has('user.name');
	sp.has('user.profile.email');

	sp.delete('user.name');
	sp.delete('user.profile.address.city');

	sp.update('user.age', (current) => (current || 0) + 1);
	sp.update('user.name', (current) => current || 'Default');

	sp.merge({
		user: {
			name: 'Updated Name',
			preferences: {
				theme: 'dark',
			},
		},
	});

	expect(true).toBe(true);
});
