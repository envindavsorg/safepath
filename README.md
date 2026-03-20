![ts-safe-path](https://private-user-images.githubusercontent.com/30373492/474619334-6e298a16-1186-4667-a960-4389730cea46.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njk2ODk1NTAsIm5iZiI6MTc2OTY4OTI1MCwicGF0aCI6Ii8zMDM3MzQ5Mi80NzQ2MTkzMzQtNmUyOThhMTYtMTE4Ni00NjY3LWE5NjAtNDM4OTczMGNlYTQ2LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjAxMjklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTI5VDEyMjA1MFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTBiNjcyN2MzYjdjMTIyM2U5NzBmNDg2ZDNjNjVmZWQ2MzdiMzhiMTAxYzdhOGQwZjNlNTBhMTU5MjEwNzM5NjcmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.psLg6FVoBvEdCi1LG3i_DcysEhXRs5zHiPkvVwQlanQ)

---

# ts-safe-path

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Type-safe nested object access and manipulation for TypeScript. Full autocompletion, zero runtime errors, zero dependencies.

## Quick Start

```typescript
import { safePath, s } from 'ts-safe-path';

const data = {
	user: {
		name: 'John',
		profile: {
			address: { city: 'Paris', country: 'France' },
		},
		preferences: { theme: 'dark', notifications: true },
	},
};

const sp = safePath(data);

// Get - full autocompletion and type inference
sp.get('user.profile.address.city'); // "Paris" (type: string | undefined)

// Set - type-checked values
sp.set('user.name', 'Jane');

// Has - check path existence
sp.has('user.profile.address'); // true

// Update - functional updates
sp.update('user.name', (current) => current?.toUpperCase() ?? 'ANONYMOUS');

// Delete - safe property removal
sp.delete('user.preferences.theme');

// Merge - deep merge preserving existing data
sp.merge({ user: { preferences: { theme: 'light' } } });

// Validate - schema validation
const result = sp.validate('user.name', s.string().min(2));
if (result.success) console.log(result.data);
```

## Immutable Mode

All mutating operations support an `immutable` option that returns a new object, leaving the original unchanged:

```typescript
const original = { user: { name: 'John' } };
const sp = safePath(original);

const updated = sp.set('user.name', 'Jane', { immutable: true });
// original.user.name === "John"
// updated.user.name === "Jane"
```

Works with `set`, `delete`, `update`, and `merge`.

## Schema Validation

Built-in validation with the `s` schema builder:

```typescript
import { s } from 'ts-safe-path';

// Primitives
s.string(); // .min(n) .max(n) .email() .url() .regex(pattern)
s.number(); // .min(n) .max(n) .int() .positive()
s.boolean();

// Composites
s.array(s.string());
s.object({ name: s.string(), age: s.number() });

// Modifiers (available on all validators)
s.string().optional(); // allows undefined
s.string().nullable(); // allows null
s.string().default('fallback'); // default for undefined/null
s.string().transform((str) => str.trim()); // transform after validation
```

### Validate at a path

```typescript
const sp = safePath(data);

// Validate value at path
const result = sp.validate('user.email', s.string().email());
if (!result.success) {
	result.errors.forEach((e) => console.log(e.message));
}

// Validate and set in one step (throws on failure)
sp.validateAndSet('user.age', 25, s.number().min(0).max(120));

// Non-strict mode: returns original object on validation failure
sp.validateAndSet('user.age', 'bad', s.number(), { strict: false });
```

### Standalone validation

```typescript
const schema = s.object({
	name: s
		.string()
		.min(2)
		.transform((n) => n.trim()),
	email: s.string().email(),
	age: s.number().min(13).optional(),
});

const result = schema.validate(inputData);
if (result.success) {
	// result.data is fully typed
}

// Or throw on failure
const data = schema.parse(inputData);
```

## Utility Functions

Use standalone functions without creating a `safePath` instance:

```typescript
import {
	getValueByPath,
	setValueByPath,
	hasPath,
	deletePath,
	isValidPath,
	getAllPaths,
	clearPathCache,
} from 'ts-safe-path';

getValueByPath(obj, 'user.name'); // get value
setValueByPath(obj, 'user.name', 'Jane'); // set value
hasPath(obj, 'user.name'); // check existence
deletePath(obj, 'user.name'); // delete property
isValidPath(obj, 'user.name'); // runtime path validation
getAllPaths(obj); // discover all paths
clearPathCache(); // clear internal path parsing cache
```

## API Reference

### `safePath(obj, options?)`

| Method                                          | Returns                             |
| ----------------------------------------------- | ----------------------------------- |
| `get(path)`                                     | `PathValue<T, P> \| undefined`      |
| `set(path, value, options?)`                    | `T`                                 |
| `has(path)`                                     | `boolean`                           |
| `delete(path, options?)`                        | `T`                                 |
| `update(path, fn, options?)`                    | `T`                                 |
| `merge(partial, options?)`                      | `T`                                 |
| `getAllPaths()`                                 | `PathKeys<T>[]`                     |
| `isValidPath(path)`                             | `boolean`                           |
| `validate(path, schema)`                        | `ValidationResult<PathValue<T, P>>` |
| `validateAndSet(path, value, schema, options?)` | `T`                                 |

**Options:** `{ immutable?: boolean }` for set/delete/update/merge.
**ValidatedOptions:** Also accepts `{ strict?: boolean }` (default `true`, throws on failure).

## License

MIT
