# Changelog

## 2.0.0

Complete pivot: the package is now **pathsafe** (formerly `@envindavsorg/ts-safe-path`).

### Breaking changes

- **Package renamed** to `pathsafe` (the old GitHub Packages `publishConfig` is gone; public npm publishing planned).
- **The built-in `s` schema builder is removed.** `validate` / `validateAndSet` now accept any [Standard Schema](https://standardschema.dev) validator instead: Zod 3.24+, Valibot v1+, ArkType 2+, Effect Schema… Migrate `s.string().min(2)` to e.g. `z.string().min(2)`.
- `validate` now returns the Standard Schema result shape (`{ value }` or `{ issues }`) instead of `{ success, data, errors }`.
- `validateAndSet` throws `PathValidationError` (with `.path` and `.issues`) instead of a generic `Error`.
- Writing through `__proto__`, `constructor` or `prototype` now **throws a `TypeError`** (previously: silent prototype pollution — a security flaw).
- `get` no longer reads inherited properties (own properties only, consistent with `has`).
- Immutable operations use **copy-on-write with structural sharing** instead of `structuredClone`: untouched branches keep their reference, and objects containing functions/symbols no longer throw.
- `delete` on an array index now splices (no holes left in the array).
- Dual **ESM + CJS** build (`exports` field); requires a bundler or Node resolution aware of `exports`.

### Added

- `get(path, defaultValue)` — typed fallback when the value is `undefined`.
- `pick(paths)` — extract several paths into a flat, fully typed object.
- `validateAll(schemas)` — validate several paths in one call, issues aggregated by path; mixes validator libraries freely.
- `validateAsync` / `validateAndSetAsync` — for async schemas (e.g. Zod `.refine(async …)`).
- `PathsTo<T, V>` — type of every path leading to a value assignable to `V`.
- Type-level support for **interfaces** (previously resolved to `never`), **optional properties**, **arrays and tuples** (`items.0.name`), **unions**, and a configurable recursion `Depth` guard against TS2589.
- `set` creates intermediate **arrays** for numeric segments.
- `merge` skips dangerous keys (`__proto__`…) from untrusted payloads.
- CI (GitHub Actions), vitest, tsup.

## 1.0.x

Original `@envindavsorg/ts-safe-path` line — typed dot-path access with a built-in schema builder, published on GitHub Packages.
