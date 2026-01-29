export type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      errors: ValidationError[];
    };

export interface ValidationError {
  path: string;
  message: string;
  received: unknown;
  expected?: string;
}

export interface SchemaValidator<T> {
  validate(data: unknown): ValidationResult<T>;
  parse(data: unknown): T;
  safeParse(data: unknown): ValidationResult<T>;
  optional(): SchemaValidator<T | undefined>;
  nullable(): SchemaValidator<T | null>;
  default(value: T): SchemaValidator<T>;
  transform<U>(fn: (data: T) => U): SchemaValidator<U>;
}

abstract class BaseValidator<T> implements SchemaValidator<T> {
  protected _optional = false;
  protected _nullable = false;
  protected _defaultValue?: T;
  protected _transform?: (data: T) => unknown;

  abstract _validate(data: unknown, path: string): ValidationResult<T>;

  validate(data: unknown): ValidationResult<T> {
    return this._validate(data, "");
  }

  parse(data: unknown): T {
    const result = this.validate(data);
    if (!result.success) {
      throw new Error(
        `Validation failed: ${result.errors.map((e) => `${e.path}: ${e.message}`).join(", ")}`,
      );
    }
    return result.data;
  }

  safeParse(data: unknown): ValidationResult<T> {
    return this.validate(data);
  }

  optional(): SchemaValidator<T | undefined> {
    const validator = this._clone();
    validator._optional = true;
    return validator as SchemaValidator<T | undefined>;
  }

  nullable(): SchemaValidator<T | null> {
    const validator = this._clone();
    validator._nullable = true;
    return validator as SchemaValidator<T | null>;
  }

  default(value: T): SchemaValidator<T> {
    const validator = this._clone();
    validator._defaultValue = value;
    return validator;
  }

  transform<U>(fn: (data: T) => U): SchemaValidator<U> {
    const validator = this._clone();
    validator._transform = fn;
    return validator as unknown as SchemaValidator<U>;
  }

  protected _clone(): BaseValidator<T> {
    const cloned = Object.create(Object.getPrototypeOf(this));
    Object.assign(cloned, this);
    return cloned;
  }

  protected _handleResult<R>(
    data: unknown,
    _path: string,
    validator: () => ValidationResult<R>,
  ): ValidationResult<T> {
    if (data === undefined && this._optional) {
      return { success: true, data: undefined as T };
    }

    if (data === null && this._nullable) {
      return { success: true, data: null as T };
    }

    if (
      (data === undefined || data === null) &&
      this._defaultValue !== undefined
    ) {
      const result = { success: true as const, data: this._defaultValue };
      return this._transform
        ? { success: true, data: this._transform(result.data) as T }
        : result;
    }

    const result = validator();
    if (!result.success) {
      return result as ValidationResult<T>;
    }

    const finalData = this._transform
      ? this._transform(result.data as unknown as T)
      : result.data;
    return { success: true, data: finalData as T };
  }
}

class StringValidator extends BaseValidator<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _pattern?: RegExp;
  private _email = false;
  private _url = false;

  _validate(data: unknown, path: string): ValidationResult<string> {
    return this._handleResult(data, path, () => {
      if (typeof data !== "string") {
        return {
          success: false,
          errors: [
            {
              path,
              message: "Expected string",
              received: data,
              expected: "string",
            },
          ],
        };
      }

      const errors: ValidationError[] = [];

      if (this._minLength !== undefined && data.length < this._minLength) {
        errors.push({
          path,
          message: `String must be at least ${this._minLength} characters`,
          received: data,
          expected: `min length ${this._minLength}`,
        });
      }

      if (this._maxLength !== undefined && data.length > this._maxLength) {
        errors.push({
          path,
          message: `String must be at most ${this._maxLength} characters`,
          received: data,
          expected: `max length ${this._maxLength}`,
        });
      }

      if (this._pattern && !this._pattern.test(data)) {
        errors.push({
          path,
          message: `String does not match pattern ${this._pattern}`,
          received: data,
          expected: `pattern ${this._pattern}`,
        });
      }

      if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        errors.push({
          path,
          message: "Invalid email format",
          received: data,
          expected: "valid email",
        });
      }

      if (this._url) {
        try {
          new URL(data);
        } catch {
          errors.push({
            path,
            message: "Invalid URL format",
            received: data,
            expected: "valid URL",
          });
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, data };
    });
  }

  min(length: number): StringValidator {
    const validator = this._clone() as StringValidator;
    validator._minLength = length;
    return validator;
  }

  max(length: number): StringValidator {
    const validator = this._clone() as StringValidator;
    validator._maxLength = length;
    return validator;
  }

  regex(pattern: RegExp): StringValidator {
    const validator = this._clone() as StringValidator;
    validator._pattern = pattern;
    return validator;
  }

  email(): StringValidator {
    const validator = this._clone() as StringValidator;
    validator._email = true;
    return validator;
  }

  url(): StringValidator {
    const validator = this._clone() as StringValidator;
    validator._url = true;
    return validator;
  }
}

class NumberValidator extends BaseValidator<number> {
  private _min?: number;
  private _max?: number;
  private _int = false;
  private _positive = false;

  _validate(data: unknown, path: string): ValidationResult<number> {
    return this._handleResult(data, path, () => {
      if (typeof data !== "number" || Number.isNaN(data)) {
        return {
          success: false,
          errors: [
            {
              path,
              message: "Expected number",
              received: data,
              expected: "number",
            },
          ],
        };
      }

      const errors: ValidationError[] = [];

      if (this._min !== undefined && data < this._min) {
        errors.push({
          path,
          message: `Number must be at least ${this._min}`,
          received: data,
          expected: `>= ${this._min}`,
        });
      }

      if (this._max !== undefined && data > this._max) {
        errors.push({
          path,
          message: `Number must be at most ${this._max}`,
          received: data,
          expected: `<= ${this._max}`,
        });
      }

      if (this._int && !Number.isInteger(data)) {
        errors.push({
          path,
          message: "Expected integer",
          received: data,
          expected: "integer",
        });
      }

      if (this._positive && data <= 0) {
        errors.push({
          path,
          message: "Expected positive number",
          received: data,
          expected: "positive number",
        });
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, data };
    });
  }

  min(value: number): NumberValidator {
    const validator = this._clone() as NumberValidator;
    validator._min = value;
    return validator;
  }

  max(value: number): NumberValidator {
    const validator = this._clone() as NumberValidator;
    validator._max = value;
    return validator;
  }

  int(): NumberValidator {
    const validator = this._clone() as NumberValidator;
    validator._int = true;
    return validator;
  }

  positive(): NumberValidator {
    const validator = this._clone() as NumberValidator;
    validator._positive = true;
    return validator;
  }
}

class BooleanValidator extends BaseValidator<boolean> {
  _validate(data: unknown, path: string): ValidationResult<boolean> {
    return this._handleResult(data, path, () => {
      if (typeof data !== "boolean") {
        return {
          success: false,
          errors: [
            {
              path,
              message: "Expected boolean",
              received: data,
              expected: "boolean",
            },
          ],
        };
      }

      return { success: true, data };
    });
  }
}

class ArrayValidator<T> extends BaseValidator<T[]> {
  constructor(private elementValidator: SchemaValidator<T>) {
    super();
  }

  _validate(data: unknown, path: string): ValidationResult<T[]> {
    return this._handleResult(data, path, () => {
      if (!Array.isArray(data)) {
        return {
          success: false,
          errors: [
            {
              path,
              message: "Expected array",
              received: data,
              expected: "array",
            },
          ],
        };
      }

      const results: T[] = [];
      const errors: ValidationError[] = [];

      for (let i = 0; i < data.length; i++) {
        const result = this.elementValidator.validate(data[i]);
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push(
            ...result.errors.map((error) => ({
              ...error,
              path: `${path}[${i}]${error.path ? `.${error.path}` : ""}`,
            })),
          );
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, data: results };
    });
  }
}

class ObjectValidator<
  T extends Record<string, unknown>,
> extends BaseValidator<T> {
  constructor(private shape: { [K in keyof T]: SchemaValidator<T[K]> }) {
    super();
  }

  _validate(data: unknown, path: string): ValidationResult<T> {
    return this._handleResult(data, path, () => {
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
          success: false,
          errors: [
            {
              path,
              message: "Expected object",
              received: data,
              expected: "object",
            },
          ],
        };
      }

      const result = {} as T;
      const errors: ValidationError[] = [];

      for (const key in this.shape) {
        const validator = this.shape[key];
        const keyPath = path ? `${path}.${key}` : key;
        const validationResult = validator.validate(
          (data as Record<string, unknown>)[key],
        );

        if (validationResult.success) {
          result[key] = validationResult.data;
        } else {
          errors.push(
            ...validationResult.errors.map((error) => ({
              ...error,
              path: error.path ? `${keyPath}.${error.path}` : keyPath,
            })),
          );
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      return { success: true, data: result };
    });
  }
}

export const s = {
  string: (): StringValidator => new StringValidator(),
  number: (): NumberValidator => new NumberValidator(),
  boolean: (): BooleanValidator => new BooleanValidator(),
  array: <T>(elementValidator: SchemaValidator<T>): ArrayValidator<T> =>
    new ArrayValidator(elementValidator),
  object: <T extends Record<string, unknown>>(shape: {
    [K in keyof T]: SchemaValidator<T[K]>;
  }): ObjectValidator<T> => new ObjectValidator(shape),
};
