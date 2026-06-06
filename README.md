# pathsafe

[![CI](https://github.com/envindavsorg/safepath/actions/workflows/ci.yml/badge.svg)](https://github.com/envindavsorg/safepath/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/pathsafe)](https://www.npmjs.com/package/pathsafe)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Type-safe nested object access for TypeScript** — fully typed dot-paths (`'user.address.city'`) with autocompletion, plus validation at any path with the validator you already use: [Zod](https://zod.dev), [Valibot](https://valibot.dev), [ArkType](https://arktype.io), or any [Standard Schema](https://standardschema.dev) library.

```
pnpm add pathsafe   # npm install pathsafe / yarn add pathsafe
```

- 🎯 **Full path autocompletion** — every valid dot-path of your type, inferred
- 🛡️ **Actually safe** — hardened against prototype pollution (`__proto__`, `constructor`, `prototype` are rejected on write)
- ✅ **Bring your own validator** — `validate`/`validateAndSet` accept any Standard Schema (Zod 3.24+, Valibot v1+, ArkType 2+, Effect Schema…)
- 🧊 **Immutable mode** — copy-on-write with structural sharing (React-friendly, no deep clone)
- 📦 **Zero dependencies** — ESM + CJS, ~8 KB unminified

## Quick start

```typescript
import { safePath } from 'pathsafe';

const data = {
	user: {
		name: 'John',
		profile: {
			address: { city: 'Paris', country: 'France' },
		},
		hobbies: ['coding', 'reading'],
	},
};

const sp = safePath(data);

sp.get('user.profile.address.city'); // "Paris" (type: string | undefined)
sp.get('user.hobbies.0');            // "coding" — arrays are typed too
sp.get('user.hobbies.5', 'none');    // typed default when the value is missing
sp.set('user.name', 'Jane');         // value type-checked against the path
sp.has('user.profile.address');      // true
sp.update('user.name', (n) => n?.toUpperCase() ?? 'ANONYMOUS');
sp.delete('user.profile.address.country');
sp.merge({ user: { profile: { address: { city: 'Lyon' } } } });
sp.pick(['user.name', 'user.profile.address.city']);
// { 'user.name': 'Jane', 'user.profile.address.city': 'Lyon' } — fully typed
```

Paths autocomplete as you type, invalid paths are compile errors, and the value type is inferred from the path. Works with interfaces, type aliases, optional properties, arrays, tuples, and unions.

## Validate at a path — with your validator

This is the part no other path library does: validate the value *at a typed path* using any [Standard Schema](https://standardschema.dev) validator. No adapter, no wrapper.

```typescript
import { safePath } from 'pathsafe';
import { z } from 'zod';

const sp = safePath(data);

// Validate the current value at a path
const result = sp.validate('user.profile.address.city', z.string().min(1));
if (result.issues) {
	console.log(result.issues.map((i) => i.message));
} else {
	result.value; // typed output
}

// Validate an incoming value, then set it — in one typed step
sp.validateAndSet('user.name', input, z.string().min(2));
// throws PathValidationError on failure (or pass { strict: false } to no-op)

// Schema transforms are applied before setting
sp.validateAndSet('user.name', '  Jane  ', z.string().transform((s) => s.trim()));
```

The exact same code works with Valibot, ArkType, or any other Standard Schema library:

```typescript
import * as v from 'valibot';

sp.validate('user.profile.address.city', v.pipe(v.string(), v.minLength(1)));
sp.validateAndSet('user.name', input, v.pipe(v.string(), v.trim()));
```

Async schemas (e.g. Zod `.refine(async …)`) are supported via `validateAsync` and `validateAndSetAsync`.

### Validate several paths at once

`validateAll` checks each path against its own schema and aggregates the issues by path — perfect for validating a form or a config object field by field, even mixing validator libraries:

```typescript
const result = sp.validateAll({
	'user.name': z.string().min(2),
	'user.profile.address.city': v.pipe(v.string(), v.minLength(1)), // Valibot here, why not
});

if (!result.success) {
	result.issues; // { 'user.name': [...issues] } — only failing paths
}
```

### Constrain paths by value type

`PathsTo<T, V>` is the type of every path leading to a `V` — ideal for typed translation keys, form field bindings, or any API that only accepts certain value types:

```typescript
import type { PathsTo } from 'pathsafe';

declare function bindNumericField(path: PathsTo<FormValues, number>): void;

bindNumericField('user.age');  // ✔
bindNumericField('user.name'); // ✘ compile error — leads to a string
```

## Immutable mode

All mutating operations accept `{ immutable: true }` and return a new object using **copy-on-write**: only the nodes along the path are cloned, everything else keeps its reference — ideal for React state and memoization.

```typescript
const original = { user: { name: 'John' }, settings: { theme: 'dark' } };
const sp = safePath(original);

const updated = sp.set('user.name', 'Jane', { immutable: true });
// original.user.name === "John"
// updated.user.name === "Jane"
// updated.settings === original.settings (untouched branch, same reference)
```

Works with `set`, `delete`, `update`, `merge`, and `validateAndSet`. You can also make it the default: `safePath(obj, { immutable: true })`.

## Security

`pathsafe` refuses to write through the prototype chain:

```typescript
sp.set('__proto__.isAdmin', true);   // throws TypeError
sp.merge(JSON.parse(maliciousJson)); // __proto__ keys are skipped
```

Reads use own-property semantics (`Object.hasOwn`), so inherited properties like `toString` are never reachable through a path.

## Standalone functions

```typescript
import {
	getValueByPath,
	setValueByPath,
	hasPath,
	deletePath,
	isValidPath,
	getAllPaths,
	clearPathCache,
} from 'pathsafe';

getValueByPath(obj, 'user.name');
setValueByPath(obj, 'user.name', 'Jane');
hasPath(obj, 'user.name');
deletePath(obj, 'user.name');
isValidPath(obj, someString); // runtime check, narrows to a typed path
getAllPaths(obj);             // every path present at runtime
```

## API reference

### `safePath(obj, defaultOptions?)`

| Method                                          | Returns                                  |
| ----------------------------------------------- | ---------------------------------------- |
| `get(path)`                                     | `PathValue<T, P> \| undefined`           |
| `get(path, defaultValue)`                       | `PathValue<T, P> \| D`                   |
| `set(path, value, options?)`                    | `T`                                      |
| `has(path)`                                     | `boolean`                                |
| `delete(path, options?)`                        | `T`                                      |
| `update(path, fn, options?)`                    | `T`                                      |
| `merge(partial, options?)`                      | `T`                                      |
| `pick(paths)`                                   | `{ [K in P]: PathValue<T, K> \| undefined }` |
| `getAllPaths()`                                 | `PathKeys<T>[]`                          |
| `isValidPath(path)`                             | `path is PathKeys<T>`                    |
| `validate(path, schema)`                        | `StandardSchemaV1.Result<Output>`        |
| `validateAsync(path, schema)`                   | `Promise<StandardSchemaV1.Result<…>>`    |
| `validateAll(schemas)`                          | `PathsValidationResult`                  |
| `validateAndSet(path, value, schema, options?)` | `T`                                      |
| `validateAndSetAsync(path, value, schema, options?)` | `Promise<T>`                       |

**Options:** `{ immutable?: boolean }` for mutating methods.
**Validated options:** also `{ strict?: boolean }` (default `true` — throws `PathValidationError` on failure; `false` returns the object unchanged).

### Exported types

- `PathKeys<T, Depth = 10>` — union of every dot-path in `T` (bounded recursion; raise `Depth` for very deep types)
- `PathValue<T, P>` — the type at path `P`
- `PathsTo<T, V>` — every path in `T` whose value is assignable to `V`
- `PathSchemas<T>` / `PathsValidationResult` — input and output of `validateAll`
- `StandardSchemaV1` — the vendored Standard Schema interface
- `PathValidationError` — thrown by `validateAndSet` in strict mode (`.path`, `.issues`)

### Behavior notes

- `delete` on an array index splices (no holes left behind).
- `set` creates intermediate arrays for numeric segments (`'list.0.name'` creates `{ list: [{ name }] }`).
- Built-in objects (`Date`, `RegExp`, `Map`, `Set`…) are leaves: paths never traverse into them.
- Keys containing dots are not addressable (paths split on `.`).

## License

MIT
