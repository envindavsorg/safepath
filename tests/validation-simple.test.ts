import { s, safePath } from '../src/index';

describe('Schema Validation - Simple Tests', () => {
	test('string validation', () => {
		const schema = s.string();

		const validResult = schema.validate('hello');
		expect(validResult.success).toBe(true);
		if (validResult.success) {
			expect(validResult.data).toBe('hello');
		}

		const invalidResult = schema.validate(123);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.errors).toHaveLength(1);
			expect(invalidResult.errors[0]?.message).toBe('Expected string');
		}
	});

	test('number validation with constraints', () => {
		const schema = s.number().min(0).max(100);

		const validResult = schema.validate(50);
		expect(validResult.success).toBe(true);
		if (validResult.success) {
			expect(validResult.data).toBe(50);
		}

		const invalidResult = schema.validate(-1);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.errors).toHaveLength(1);
			expect(invalidResult.errors[0]?.message).toContain('at least 0');
		}
	});

	test('email validation', () => {
		const schema = s.string().email();

		const validResult = schema.validate('test@example.com');
		expect(validResult.success).toBe(true);

		const invalidResult = schema.validate('invalid-email');
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.errors).toHaveLength(1);
			expect(invalidResult.errors[0]?.message).toContain(
				'Invalid email format',
			);
		}
	});

	test('object validation', () => {
		const userSchema = s.object({
			name: s.string(),
			age: s.number().min(0),
		});

		const validUser = { name: 'John', age: 25 };
		const validResult = userSchema.validate(validUser);
		expect(validResult.success).toBe(true);
		if (validResult.success) {
			expect(validResult.data.name).toBe('John');
			expect(validResult.data.age).toBe(25);
		}

		const invalidUser = { name: 'John', age: -5 };
		const invalidResult = userSchema.validate(invalidUser);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.errors.length).toBeGreaterThan(0);
			expect(invalidResult.errors.some((e) => e.path === 'age')).toBe(true);
		}
	});

	test('array validation', () => {
		const schema = s.array(s.string());

		const validResult = schema.validate(['a', 'b', 'c']);
		expect(validResult.success).toBe(true);
		if (validResult.success) {
			expect(validResult.data).toEqual(['a', 'b', 'c']);
		}

		const invalidResult = schema.validate(['a', 123, 'c']);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.errors).toHaveLength(1);
			expect(invalidResult.errors[0]?.path).toBe('[1]');
			expect(invalidResult.errors[0]?.message).toContain('Expected string');
		}
	});

	test('optional and default values', () => {
		const optionalSchema = s.string().optional();
		const undefinedResult = optionalSchema.validate(undefined);
		expect(undefinedResult.success).toBe(true);
		if (undefinedResult.success) {
			expect(undefinedResult.data).toBeUndefined();
		}

		const defaultSchema = s.string().default('default');
		const defaultResult = defaultSchema.validate(undefined);
		expect(defaultResult.success).toBe(true);
		if (defaultResult.success) {
			expect(defaultResult.data).toBe('default');
		}
	});

	test('transform', () => {
		const schema = s.string().transform((str) => str.toUpperCase());
		const result = schema.validate('hello');
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toBe('HELLO');
		}
	});
});

describe('SafePath Integration', () => {
	test('basic validation integration', () => {
		const data = {
			user: {
				name: 'John',
				age: 25,
			},
		};

		const safe = safePath(data);

		// Test validation of existing value
		const nameResult = safe.validate('user.name', s.string());
		expect(nameResult.success).toBe(true);
		if (nameResult.success) {
			expect(nameResult.data).toBe('John');
		}

		// Test validation with constraint
		const ageResult = safe.validate('user.age', s.number().min(18));
		expect(ageResult.success).toBe(true);
		if (ageResult.success) {
			expect(ageResult.data).toBe(25);
		}

		// Test failed validation
		const failedResult = safe.validate('user.age', s.number().min(30));
		expect(failedResult.success).toBe(false);
	});

	test('validateAndSet success', () => {
		const data = { user: { name: 'John' } };
		const safe = safePath(data);

		const result = safe.validateAndSet('user.name', 'Jane', s.string());
		expect(result.user.name).toBe('Jane');
	});

	test('validateAndSet failure with strict mode', () => {
		const data = { user: { age: 25 } };
		const safe = safePath(data);

		expect(() => {
			safe.validateAndSet('user.age', 'not-a-number', s.number());
		}).toThrow('Validation failed');
	});

	test('validateAndSet failure with non-strict mode', () => {
		const data = { user: { age: 25 } };
		const safe = safePath(data);

		const result = safe.validateAndSet('user.age', 'not-a-number', s.number(), {
			strict: false,
		});
		expect(result.user.age).toBe(25); // unchanged
	});
});
