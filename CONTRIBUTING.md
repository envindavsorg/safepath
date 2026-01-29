# Contributing to ts-safe-path 🤝

Thank you for your interest in contributing to ts-safe-path! We welcome contributions from the community and are excited to see what you'll bring to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [maintainer-email].

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm, yarn, or pnpm
- Git
- TypeScript knowledge (intermediate level recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ts-safe-path.git
   cd ts-safe-path
   ```
3. **Add the original repository** as upstream:
   ```bash
   git remote add upstream https://github.com/envindavsorg/ts-safe-path.git
   ```

## 🛠️ Development Setup

### Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### Available Scripts

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test
npm test -- --testNamePattern="should get nested values"

# Build the project
npm run build

# Lint and format code
npm run lint

# Type check
npm run type-check
```

### Project Structure

```
ts-safe-path/
├── src/
│   ├── index.ts          # Main entry point
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Core utility functions
├── tests/
│   └── safePath.test.ts  # Test suite
├── dist/                 # Built output (generated)
├── CLAUDE.md            # AI assistant guidance
├── README.md            # Project documentation
└── package.json         # Project configuration
```

## 🎯 How to Contribute

### Types of Contributions

We welcome several types of contributions:

#### 🐛 **Bug Reports**

- Found a bug? Please check existing issues first
- Provide detailed reproduction steps
- Include TypeScript version and environment details

#### ✨ **Feature Requests**

- Suggest new features or improvements
- Explain the use case and benefits
- Consider backward compatibility

#### 🔧 **Code Contributions**

- Bug fixes
- Performance improvements
- New features
- Documentation improvements
- Test coverage improvements

#### 📚 **Documentation**

- Fix typos or improve clarity
- Add examples or use cases
- Improve API documentation
- Update README or guides

### What We're Looking For

**High Priority:**

- Performance optimizations
- TypeScript type improvements
- Bug fixes
- Test coverage improvements
- Documentation enhancements

**Medium Priority:**

- New utility functions
- Developer experience improvements
- Build process optimizations

**Please Discuss First:**

- Breaking changes
- Major architectural changes
- New dependencies

## 🔄 Pull Request Process

### Before You Start

1. **Check existing issues** and PRs to avoid duplication
2. **Create an issue** for significant changes to discuss the approach
3. **Keep changes focused** - one feature/fix per PR

### Step-by-Step Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following our coding standards

3. **Add tests** for new functionality:

   ```bash
   npm test
   ```

4. **Update documentation** if needed

5. **Lint and type-check** your code:

   ```bash
   npm run lint
   npm run type-check
   ```

6. **Commit your changes** with a clear message:

   ```bash
   git commit -m "feat: add new utility function for path validation"
   # or
   git commit -m "fix: handle null values in nested paths"
   ```

7. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

### Pull Request Guidelines

#### Title Format

Use conventional commit format:

- `feat: add new feature`
- `fix: resolve bug in path parsing`
- `docs: update API documentation`
- `test: add coverage for edge cases`
- `perf: optimize path caching mechanism`
- `refactor: simplify type definitions`

#### Description Template

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Updated existing tests if needed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes are documented)
```

## 📏 Coding Standards

### TypeScript Guidelines

```typescript
// ✅ Good: Use explicit types for public APIs
export function getValueByPath<
  T extends Record<string, any>,
  P extends PathKeys<T>,
>(obj: T, path: P): PathValue<T, P> | undefined {
  // Implementation
}

// ❌ Avoid: Using 'any' without constraint
export function getValue(obj: any, path: any): any {
  // Implementation
}
```

### Code Style

- **Use TypeScript strictly** - enable all strict checks
- **Prefer const assertions** for immutable data
- **Use descriptive variable names** - clarity over brevity
- **Document complex logic** with comments
- **Keep functions small** and focused on single responsibility

### Performance Considerations

- **Minimize object allocations** in hot paths
- **Cache expensive computations** when beneficial
- **Use early returns** to avoid unnecessary work
- **Consider memory usage** for large objects

### Example Code Style

```typescript
// ✅ Good: Clear, typed, documented
/**
 * Safely retrieves a value from a nested object path.
 * @param obj - The source object
 * @param path - Dot-notation path to the value
 * @returns The value at the path, or undefined if not found
 */
export function getValueByPath<
  T extends Record<string, any>,
  P extends PathKeys<T>,
>(obj: T, path: P): PathValue<T, P> | undefined {
  const keys = parsePath(path as string);
  let result: any = obj;

  for (const key of keys) {
    if (result == null || typeof result !== "object") {
      return undefined;
    }
    result = result[key];
  }

  return result as PathValue<T, P>;
}
```

## 🧪 Testing Guidelines

### Test Structure

We use Jest with TypeScript. Tests should be:

- **Descriptive** - test names should clearly describe what's being tested
- **Isolated** - each test should be independent
- **Comprehensive** - cover happy paths, edge cases, and error conditions

### Writing Tests

```typescript
describe("safePath", () => {
  describe("get method", () => {
    it("should return value for valid nested path", () => {
      const obj = { user: { name: "John" } };
      const sp = safePath(obj);

      expect(sp.get("user.name")).toBe("John");
    });

    it("should return undefined for non-existent path", () => {
      const obj = { user: { name: "John" } };
      const sp = safePath(obj);

      expect(sp.get("user.email" as any)).toBeUndefined();
    });

    it("should handle null intermediate values", () => {
      const obj = { user: null };
      const sp = safePath(obj);

      expect(sp.get("user.name" as any)).toBeUndefined();
    });
  });
});
```

### Test Categories

1. **Unit Tests** - Test individual functions
2. **Integration Tests** - Test component interactions
3. **Type Tests** - Verify TypeScript type behavior
4. **Performance Tests** - Ensure optimizations work
5. **Edge Case Tests** - Handle unusual inputs

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- safePath.test.ts

# Run specific test
npm test -- --testNamePattern="should get nested values"
```

## 📖 Documentation

### Code Documentation

- **Use JSDoc** for all public APIs
- **Include examples** in documentation
- **Document complex algorithms** with inline comments
- **Keep docs up-to-date** with code changes

### README Updates

When adding features:

- Add examples to appropriate sections
- Update API reference table
- Add performance notes if relevant
- Update feature list

## 🐛 Issue Guidelines

### Bug Reports

Please include:

- **Clear description** of the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Environment details** (OS, Node.js version, TypeScript version)
- **Code sample** demonstrating the issue

#### Bug Report Template

````markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Create object with structure '...'
2. Call safePath method '...'
3. See error

**Expected behavior**
What you expected to happen.

**Code sample**

```typescript
const obj = {
  /* ... */
};
const sp = safePath(obj);
// Code that demonstrates the issue
```
````

**Environment**

- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 18.0.0]
- TypeScript: [e.g. 4.8.0]
- ts-safe-path: [e.g. 1.0.0]

```

### Feature Requests

Please include:
- **Clear description** of the proposed feature
- **Use case** - why is this needed?
- **Proposed API** - how should it work?
- **Alternatives considered** - other approaches you've thought about

## 💬 Community

### Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and general discussion
- **Stack Overflow** - Tag questions with `ts-safe-path`

### Communication Guidelines

- **Be respectful** and inclusive
- **Search existing issues** before creating new ones
- **Provide context** when asking questions
- **Help others** when you can

## 🏆 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub repository** with contributor badges

## 📝 License

By contributing to ts-safe-path, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

If you have questions about contributing, feel free to:
- Open a discussion on GitHub
- Create an issue with the `question` label
- Reach out to the maintainers

---

Thank you for contributing to ts-safe-path! 🎉

Your contributions help make TypeScript development safer and more enjoyable for everyone.
```
