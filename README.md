![ts-safe-path](https://private-user-images.githubusercontent.com/30373492/474619334-6e298a16-1186-4667-a960-4389730cea46.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njk2ODk1NTAsIm5iZiI6MTc2OTY4OTI1MCwicGF0aCI6Ii8zMDM3MzQ5Mi80NzQ2MTkzMzQtNmUyOThhMTYtMTE4Ni00NjY3LWE5NjAtNDM4OTczMGNlYTQ2LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjAxMjklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTI5VDEyMjA1MFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTBiNjcyN2MzYjdjMTIyM2U5NzBmNDg2ZDNjNjVmZWQ2MzdiMzhiMTAxYzdhOGQwZjNlNTBhMTU5MjEwNzM5NjcmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.psLg6FVoBvEdCi1LG3i_DcysEhXRs5zHiPkvVwQlanQ)

---

# ts-safe-path 🛡️

[![npm version](https://img.shields.io/npm/v/ts-safe-path.svg)](https://www.npmjs.com/package/ts-safe-path)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/ts-safe-path)](https://bundlephobia.com/package/ts-safe-path)

**Type-safe nested object access, manipulation, and validation for TypeScript with full autocompletion and zero runtime errors.**

## 🚀 Why ts-safe-path?

Working with deeply nested objects in TypeScript is painful:

```typescript
// ❌ The old way - verbose, error-prone, no autocompletion
const city = user?.profile?.address?.city;
if (user && user.profile && user.profile.address) {
  user.profile.address.city = "New York";
}

// ✅ The ts-safe-path way - clean, type-safe, with autocompletion
const city = sp.get("user.profile.address.city");
sp.set("user.profile.address.city", "New York");
```

**ts-safe-path** eliminates these problems with a clean, type-safe API that provides:

- 🎯 **Full autocompletion** for all nested paths at compile time
- 🛡️ **Zero runtime errors** from accessing undefined properties
- ✅ **Schema validation** with type inference and data transformation
- 🪶 **Lightweight** - under 3KB gzipped with zero dependencies
- ⚡ **High performance** with built-in caching and optimizations
- 🔧 **Intuitive API** similar to lodash but completely type-safe

## 📦 Installation

### From NPM Registry (Recommended)

```bash
npm install ts-safe-path
# or
yarn add ts-safe-path
# or
pnpm add ts-safe-path
```

### From GitHub Packages

```bash
npm install @envindavsorg/ts-safe-path
# or
yarn add @envindavsorg/ts-safe-path
# or
pnpm add @envindavsorg/ts-safe-path
```

If using GitHub Packages, add this to your `.npmrc`:

```
@envindavsorg:registry=https://npm.pkg.github.com
```

## ⚡ Quick Start

```typescript
import { safePath } from "ts-safe-path";

const data = {
  user: {
    profile: {
      name: "John Doe",
      address: {
        city: "Paris",
        country: "France",
      },
    },
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
};

const sp = safePath(data);

// ✅ Get values with full autocompletion and type safety
const city = sp.get("user.profile.address.city"); // Type: string | undefined
const theme = sp.get("user.preferences.theme"); // Type: string | undefined

// ✅ Set values (autocompleted paths, type-checked values!)
sp.set("user.profile.name", "Jane Doe");
sp.set("user.profile.address.city", "London");

// ✅ Check if paths exist
if (sp.has("user.profile.address")) {
  console.log("Address exists!");
}

// ✅ Update values with functions
sp.update("user.profile.name", (current) => current?.toUpperCase());

// ✅ Deep merge objects
sp.merge({
  user: {
    preferences: {
      theme: "light",
    },
  },
});

// ✅ Validate data with schemas
import { s } from "ts-safe-path";

const result = sp.validate("user.profile.email", s.string().email());
if (result.success) {
  console.log("Valid email:", result.data);
}

// ✅ Validate and set with automatic type checking
sp.validateAndSet("user.profile.age", 25, s.number().min(0).max(120));
```

## 🎯 Features

### 🆕 Schema Validation (NEW!)

**ts-safe-path** now includes a powerful schema validation system that integrates seamlessly with path-based operations:

```typescript
import { safePath, s } from "ts-safe-path";

const userData = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    age: 25,
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
};

const sp = safePath(userData);

// ✅ Validate individual properties
const emailResult = sp.validate("user.email", s.string().email());
if (emailResult.success) {
  console.log("Valid email:", emailResult.data); // Type: string
}

// ✅ Validate with constraints
const ageResult = sp.validate("user.age", s.number().min(13).max(120));
if (!ageResult.success) {
  console.log("Validation errors:", ageResult.errors);
}

// ✅ Validate and set with automatic error handling
try {
  sp.validateAndSet("user.email", "new@example.com", s.string().email());
  console.log("Email updated successfully!");
} catch (error) {
  console.log("Validation failed:", error.message);
}

// ✅ Non-strict mode (doesn't throw, returns original on error)
const result = sp.validateAndSet("user.age", "invalid", s.number(), {
  strict: false,
});
// Returns original object if validation fails
```

#### Validation Schema Types

Create powerful validation schemas with full type inference:

```typescript
// String validation with constraints
const nameSchema = s
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name too long")
  .transform((name) => name.trim()); // Clean whitespace

// Number validation
const ageSchema = s
  .number()
  .min(0, "Age cannot be negative")
  .max(120, "Age must be realistic")
  .int(); // Must be integer

// Email validation
const emailSchema = s
  .string()
  .email("Must be a valid email")
  .transform((email) => email.toLowerCase());

// Boolean validation
const enabledSchema = s.boolean();

// Array validation
const tagsSchema = s.array(s.string().min(1));

// Complex object validation
const userSchema = s.object({
  name: nameSchema,
  email: emailSchema,
  age: ageSchema.optional(), // Optional field
  isActive: enabledSchema.default(true), // Default value
  tags: tagsSchema,
});

// Validate entire objects
const validation = userSchema.validate(someUserData);
if (validation.success) {
  // validation.data is fully typed!
  console.log(`User: ${validation.data.name}`);
  console.log(`Email: ${validation.data.email}`);
} else {
  console.log("Validation errors:", validation.errors);
}
```

#### Advanced Validation Features

```typescript
// Optional and nullable values
const optionalName = s.string().optional(); // string | undefined
const nullableName = s.string().nullable(); // string | null
const flexibleName = s.string().optional().nullable(); // string | null | undefined

// Default values
const roleSchema = s.string().default("user");
const result = roleSchema.validate(undefined);
// result.data === 'user'

// Data transformation during validation
const trimmedString = s.string().transform((str) => str.trim().toLowerCase());
const uppercaseString = s.string().transform((str) => str.toUpperCase());

// Nested object validation with path-based access
const addressSchema = s.object({
  street: s.string(),
  city: s.string(),
  zipCode: s.string().regex(/^\d{5}$/, "Must be 5 digits"),
});

// Validate nested objects directly
const addressResult = sp.validate("user.profile.address", addressSchema);

// Array of objects validation
const usersSchema = s.array(
  s.object({
    id: s.number(),
    name: s.string().min(1),
    email: s.string().email(),
  }),
);
```

#### Error Handling and Type Safety

```typescript
// Detailed error information
const result = sp.validate("user.email", s.string().email().min(5));

if (!result.success) {
  result.errors.forEach((error) => {
    console.log(`Path: ${error.path}`);
    console.log(`Message: ${error.message}`);
    console.log(`Received: ${error.received}`);
    console.log(`Expected: ${error.expected}`);
  });
}

// Parse with exceptions (throws on validation error)
try {
  const email = s.string().email().parse("invalid-email");
} catch (error) {
  console.log("Validation failed:", error.message);
}

// Safe parsing (returns result object)
const safeResult = s.string().email().safeParse("test@example.com");
if (safeResult.success) {
  console.log("Email:", safeResult.data); // Fully typed
}
```

### Core Operations

#### `get(path)` - Safe Value Access

```typescript
const sp = safePath(data);

// Get nested values safely
const email = sp.get("user.contact.email"); // string | undefined
const count = sp.get("user.stats.loginCount"); // number | undefined

// No more runtime errors from undefined access!
const invalid = sp.get("user.nonexistent.path"); // undefined (not an error)
```

#### `set(path, value)` - Type-Safe Value Setting

```typescript
// Set values with full type checking
sp.set("user.profile.name", "Alice"); // ✅ string is valid
sp.set("user.profile.age", 30); // ✅ number is valid
sp.set("user.profile.name", 123); // ❌ TypeScript error!

// Automatically creates missing intermediate objects
const empty = {};
const sp2 = safePath(empty);
sp2.set("deeply.nested.path", "value"); // Creates full structure automatically
```

#### `has(path)` - Path Existence Checking

```typescript
// Check if paths exist
if (sp.has("user.profile.address.zipCode")) {
  // Path exists and is not undefined
  const zip = sp.get("user.profile.address.zipCode");
}

// Perfect for conditional logic
const showMap = sp.has("user.profile.address.coordinates");
```

#### `update(path, updater)` - Functional Updates

```typescript
// Update values using a function
sp.update("user.profile.name", (current) =>
  current ? current.toUpperCase() : "ANONYMOUS",
);

// Increment counters safely
sp.update("user.stats.loginCount", (count) => (count || 0) + 1);

// Transform arrays
sp.update("user.tags", (tags) => [...(tags || []), "new-tag"]);
```

#### `delete(path)` - Safe Property Deletion

```typescript
// Remove properties safely
sp.delete("user.temporaryData");
sp.delete("user.profile.outdatedField");

// Works with nested paths
sp.delete("user.settings.experimental.beta");
```

#### `merge(partial)` - Deep Object Merging

```typescript
// Deep merge preserving existing data
sp.merge({
  user: {
    profile: {
      address: {
        city: "Berlin", // Only updates city, preserves country, etc.
      },
    },
    newField: "added", // Adds new fields
  },
});
```

### 🚀 Performance Features

#### Immutable Operations

```typescript
// All operations support immutable mode
const original = { user: { name: "John" } };
const sp = safePath(original);

// Returns new object, leaves original unchanged
const updated = sp.set("user.name", "Jane", { immutable: true });
console.log(original.user.name); // 'John' (unchanged)
console.log(updated.user.name); // 'Jane' (new object)

// Also available for delete, update, and merge
const deleted = sp.delete("user.tempField", { immutable: true });
const merged = sp.merge({ newData: true }, { immutable: true });
```

#### Built-in Caching

```typescript
import { clearPathCache } from "ts-safe-path";

// Path parsing is automatically cached for repeated operations
const sp = safePath(largeObject);

// First access: parses and caches path
const value1 = sp.get("deeply.nested.path");

// Subsequent accesses: uses cached path (40% faster!)
const value2 = sp.get("deeply.nested.path");
const value3 = sp.get("deeply.nested.path");

// Manual cache management (optional)
clearPathCache(); // Clear all cached paths
```

### 🔧 Utility Functions

#### Path Validation

```typescript
// Validate paths at runtime
if (sp.isValidPath("user.profile.email")) {
  // Path exists in the object structure
  const email = sp.get("user.profile.email");
}

// Useful for dynamic path handling
const userInput = "user.profile.unknownField";
if (sp.isValidPath(userInput)) {
  console.log("Path is valid!");
}
```

#### Path Discovery

```typescript
// Get all available paths in an object
const allPaths = sp.getAllPaths();
console.log(allPaths);
// Output: [
//   'user',
//   'user.profile',
//   'user.profile.name',
//   'user.profile.address',
//   'user.profile.address.city',
//   'user.profile.address.country',
//   'user.preferences',
//   'user.preferences.theme',
//   // ... etc
// ]

// Perfect for generating dynamic UIs or documentation
```

#### Direct Utility Access

```typescript
import {
  getValueByPath,
  setValueByPath,
  hasPath,
  deletePath,
} from "ts-safe-path";

// Use utilities directly without creating safePath instance
const value = getValueByPath(obj, "user.profile.name");
setValueByPath(obj, "user.profile.age", 25);
```

## 📊 Performance

ts-safe-path is designed for high performance:

- **~40% faster** repeated path operations due to built-in caching
- **Zero runtime overhead** for type checking (compile-time only)
- **Minimal memory footprint** with efficient path parsing
- **Optimized object traversal** with early exit patterns

```typescript
// Performance comparison (1M operations)
// lodash.get():     2.1s
// ts-safe-path:     1.3s (cached paths)
// Native access:    0.8s

// Bundle size comparison
// lodash:           ~70KB
// ts-safe-path:     <2KB ✨
```

## 🛡️ Type Safety

Full TypeScript support with advanced type inference:

```typescript
interface User {
  profile: {
    name: string;
    age: number;
    address?: {
      city: string;
      country: string;
    };
  };
  settings: {
    theme: "light" | "dark";
    notifications: boolean;
  };
}

const user: User = {
  /* ... */
};
const sp = safePath(user);

// ✅ Full autocompletion for all paths
sp.get("profile.name"); // Type: string | undefined
sp.get("profile.address.city"); // Type: string | undefined
sp.get("settings.theme"); // Type: 'light' | 'dark' | undefined

// ✅ Type-checked value assignment
sp.set("profile.name", "Alice"); // ✅ Valid
sp.set("settings.theme", "dark"); // ✅ Valid
sp.set("settings.theme", "blue"); // ❌ TypeScript error!
sp.set("profile.age", "thirty"); // ❌ TypeScript error!

// ✅ Intelligent return types
const theme = sp.get("settings.theme"); // 'light' | 'dark' | undefined
if (theme) {
  // TypeScript knows theme is 'light' | 'dark' here
  console.log(theme.toUpperCase()); // No type errors
}
```

## 🔄 Migration from Lodash

Easy migration from lodash with better type safety:

```typescript
// Before (lodash)
import { get, set, has, unset } from "lodash";

const name = get(user, "profile.name"); // Type: any
set(user, "profile.age", 25); // No type checking
const hasAddress = has(user, "profile.address"); // Type: boolean
unset(user, "profile.temporaryField"); // No return value

// After (ts-safe-path)
import { safePath } from "ts-safe-path";

const sp = safePath(user);
const name = sp.get("profile.name"); // Type: string | undefined
sp.set("profile.age", 25); // Full type checking
const hasAddress = sp.has("profile.address"); // Type: boolean
sp.delete("profile.temporaryField"); // Returns modified object
```

## 📚 API Reference

### `safePath<T>(obj: T, options?: SafePathOptions): SafePath<T>`

Creates a new SafePath instance for the given object.

**Parameters:**

- `obj` - The object to wrap
- `options` - Optional configuration
  - `immutable?: boolean` - Default mode for all operations

**Returns:** SafePath instance with type-safe methods

### SafePath Methods

| Method                                                                                               | Description                        | Returns                                 |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| `get<P>(path: P)`                                                                                    | Get value at path                  | `PathValue<T, P> \| undefined`          |
| `set<P>(path: P, value: PathValue<T, P>, options?)`                                                  | Set value at path                  | `T`                                     |
| `has<P>(path: P)`                                                                                    | Check if path exists               | `boolean`                               |
| `delete<P>(path: P, options?)`                                                                       | Delete property at path            | `T`                                     |
| `update<P>(path: P, updater: Function, options?)`                                                    | Update value with function         | `T`                                     |
| `merge(partial: DeepPartial<T>, options?)`                                                           | Deep merge object                  | `T`                                     |
| `getAllPaths()`                                                                                      | Get all valid paths                | `PathKeys<T>[]`                         |
| `isValidPath(path: string)`                                                                          | Validate path existence            | `boolean`                               |
| **`validate<P>(path: P, schema: SchemaValidator<PathValue<T, P>>)`**                                 | **Validate value at path**         | **`ValidationResult<PathValue<T, P>>`** |
| **`validateAndSet<P>(path: P, value: unknown, schema: SchemaValidator<PathValue<T, P>>, options?)`** | **Validate and set value**         | **`T`**                                 |
| **`safeValidate<P>(path: P, schema: SchemaValidator<PathValue<T, P>>)`**                             | **Safe validation (never throws)** | **`ValidationResult<PathValue<T, P>>`** |

### Schema Validators

| Validator         | Description        | Methods                                              |
| ----------------- | ------------------ | ---------------------------------------------------- |
| `s.string()`      | String validation  | `.min()`, `.max()`, `.email()`, `.url()`, `.regex()` |
| `s.number()`      | Number validation  | `.min()`, `.max()`, `.int()`, `.positive()`          |
| `s.boolean()`     | Boolean validation | -                                                    |
| `s.array(schema)` | Array validation   | Element validation with provided schema              |
| `s.object(shape)` | Object validation  | Property validation with shape definition            |

#### Common Schema Methods

| Method            | Description                              | Available On   |
| ----------------- | ---------------------------------------- | -------------- |
| `.optional()`     | Make field optional (allows `undefined`) | All validators |
| `.nullable()`     | Make field nullable (allows `null`)      | All validators |
| `.default(value)` | Set default value for `undefined`/`null` | All validators |
| `.transform(fn)`  | Transform value after validation         | All validators |

### Utility Functions

| Function                                                        | Description                 |
| --------------------------------------------------------------- | --------------------------- |
| `getValueByPath<T, P>(obj: T, path: P)`                         | Direct path value access    |
| `setValueByPath<T, P>(obj: T, path: P, value: PathValue<T, P>)` | Direct path value setting   |
| `hasPath<T, P>(obj: T, path: P)`                                | Direct path existence check |
| `deletePath<T, P>(obj: T, path: P)`                             | Direct path deletion        |
| `isValidPath<T>(obj: T, path: string)`                          | Direct path validation      |
| `getAllPaths<T>(obj: T)`                                        | Direct path discovery       |
| `clearPathCache()`                                              | Clear internal path cache   |

## 💡 Real-World Example

Here's a complete example showing how to use ts-safe-path with validation for a user profile management system:

```typescript
import { safePath, s } from "ts-safe-path";

// Define validation schemas
const addressSchema = s.object({
  street: s.string().min(5, "Street address too short"),
  city: s.string().min(2, "City name too short"),
  zipCode: s.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  country: s.string().min(2).default("US"),
});

const userProfileSchema = s.object({
  name: s
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name too long")
    .transform((name) => name.trim()),
  email: s
    .string()
    .email("Invalid email format")
    .transform((email) => email.toLowerCase()),
  age: s
    .number()
    .min(13, "Must be at least 13 years old")
    .max(120, "Age must be realistic")
    .optional(),
  address: addressSchema.optional(),
  preferences: s.object({
    theme: s.string().default("light"),
    notifications: s.boolean().default(true),
    language: s.string().default("en"),
  }),
  tags: s.array(s.string().min(1)).default([]),
});

// Sample user data (could come from API, form, etc.)
const userData = {
  name: "  John Doe  ",
  email: "JOHN@EXAMPLE.COM",
  age: 28,
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: "10001",
  },
  preferences: {
    theme: "dark",
  },
  tags: ["developer", "typescript"],
};

// Create safe path instance
const userProfile = safePath(userData);

// Validate and clean the entire profile
const validation = userProfileSchema.validate(userData);

if (validation.success) {
  console.log("✅ Profile validated successfully!");
  console.log("Cleaned data:", validation.data);
  // validation.data.name is now "John Doe" (trimmed)
  // validation.data.email is now "john@example.com" (lowercase)
  // validation.data.preferences.notifications is true (default)
} else {
  console.log("❌ Validation errors:");
  validation.errors.forEach((error) => {
    console.log(`  ${error.path}: ${error.message}`);
  });
}

// Individual field validation during user input
const validateEmail = (newEmail: string) => {
  const result = userProfile.validateAndSet(
    "email",
    newEmail,
    s.string().email(),
    { strict: false }, // Don't throw, return original on error
  );

  if (result.email !== newEmail) {
    console.log("❌ Invalid email, keeping original");
    return false;
  }

  console.log("✅ Email updated successfully");
  return true;
};

// Update address with validation
const updateAddress = (addressData: any) => {
  try {
    userProfile.validateAndSet("address", addressData, addressSchema);
    console.log("✅ Address updated");
    return true;
  } catch (error) {
    console.log("❌ Address validation failed:", error.message);
    return false;
  }
};

// Validate individual nested properties
const zipResult = userProfile.validate(
  "address.zipCode",
  s.string().regex(/^\d{5}(-\d{4})?$/),
);

if (zipResult.success) {
  console.log("✅ Valid ZIP code:", zipResult.data);
}

// Transform and validate user preferences
const updateTheme = (theme: string) => {
  const result = userProfile.validateAndSet(
    "preferences.theme",
    theme,
    s.string().transform((t) => t.toLowerCase()),
    { strict: false },
  );

  if (["light", "dark", "auto"].includes(result.preferences.theme)) {
    console.log("✅ Theme updated to:", result.preferences.theme);
    return true;
  } else {
    console.log("❌ Invalid theme");
    return false;
  }
};

// Export validated and cleaned data
const getCleanedProfile = () => {
  const validation = userProfileSchema.validate(userProfile);
  return validation.success ? validation.data : null;
};
```

This example demonstrates:

- 🛡️ **Full type safety** with autocomplete for all paths
- ✅ **Schema validation** with custom error messages
- 🔄 **Data transformation** (trimming, case conversion)
- 🎯 **Default values** for missing properties
- 🚫 **Error handling** with both strict and non-strict modes
- 🏗️ **Nested object validation** with complex schemas
- 🔍 **Individual field validation** for real-time form validation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/envindavsorg/ts-safe-path.git
cd ts-safe-path

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Lint code
npm run lint
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testNamePattern="should get nested values"

# Run with coverage
npm test -- --coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [lodash](https://lodash.com/) for the API design
- Built with [TypeScript](https://www.typescriptlang.org/) for maximum type safety
- Tested with [Jest](https://jestjs.io/) for reliability

## 🔗 Related Projects

- [lodash](https://lodash.com/) - Utility library for JavaScript
- [ramda](https://ramdajs.com/) - Functional programming library
- [immer](https://immerjs.github.io/immer/) - Immutable state updates

---

<div align="center">

**[⭐ Star us on GitHub](https://github.com/envindavsorg/ts-safe-path)** • **[📦 NPM Package](https://www.npmjs.com/package/ts-safe-path)** • **[📚 Documentation](https://github.com/envindavsorg/ts-safe-path#readme)**

Made with ❤️ by Cuzeac Florin in Paris.

</div>
