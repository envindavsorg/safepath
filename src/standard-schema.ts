/**
 * The Standard Schema interface (https://standardschema.dev), version 1.
 *
 * Vendored as recommended by the spec so pathsafe stays zero-dependency.
 * Any library implementing it — Zod 3.24+, Valibot v1+, ArkType 2+,
 * Effect Schema, and others — can be passed to `validate`/`validateAndSet`.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  /** The Standard Schema properties. */
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  /** The Standard Schema properties interface. */
  export interface Props<Input = unknown, Output = Input> {
    /** Inferred types associated with the schema. */
    readonly types?: Types<Input, Output> | undefined;
    /** Validates unknown input values. */
    readonly validate: (
      value: unknown
    ) => Result<Output> | Promise<Result<Output>>;
    /** The vendor name of the schema library. */
    readonly vendor: string;
    /** The version number of the standard. */
    readonly version: 1;
  }

  /** The result interface of the validate function. */
  export type Result<Output> = SuccessResult<Output> | FailureResult;

  /** The result interface if validation succeeds. */
  export interface SuccessResult<Output> {
    /** The non-existent issues. */
    readonly issues?: undefined;
    /** The typed output value. */
    readonly value: Output;
  }

  /** The result interface if validation fails. */
  export interface FailureResult {
    /** The issues of failed validation. */
    readonly issues: ReadonlyArray<Issue>;
  }

  /** The issue interface of the failure output. */
  export interface Issue {
    /** The error message of the issue. */
    readonly message: string;
    /** The path of the issue, if any. */
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  /** The path segment interface of the issue. */
  export interface PathSegment {
    /** The key representing a path segment. */
    readonly key: PropertyKey;
  }

  /** The Standard Schema types interface. */
  export interface Types<Input = unknown, Output = Input> {
    /** The input type of the schema. */
    readonly input: Input;
    /** The output type of the schema. */
    readonly output: Output;
  }

  /** Infers the input type of a Standard Schema. */
  export type InferInput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["input"];

  /** Infers the output type of a Standard Schema. */
  export type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
    Schema["~standard"]["types"]
  >["output"];
}

/** Error thrown when `validateAndSet` rejects a value in strict mode. */
export class PathValidationError extends Error {
  readonly issues: ReadonlyArray<StandardSchemaV1.Issue>;
  readonly path: string;

  constructor(path: string, issues: ReadonlyArray<StandardSchemaV1.Issue>) {
    super(
      `Validation failed for path "${path}": ${issues
        .map((issue) => issue.message)
        .join(", ")}`
    );
    this.name = "PathValidationError";
    this.issues = issues;
    this.path = path;
  }
}

/**
 * Runs a Standard Schema validation synchronously. Throws if the schema
 * performs async validation — use the `Async` variants for those.
 */
export const validateSync = <Schema extends StandardSchemaV1>(
  schema: Schema,
  value: unknown
): StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>> => {
  const result = schema["~standard"].validate(value);
  if (result instanceof Promise) {
    throw new TypeError(
      `Schema (vendor "${schema["~standard"].vendor}") validates asynchronously: use validateAsync/validateAndSetAsync instead`
    );
  }
  return result as StandardSchemaV1.Result<
    StandardSchemaV1.InferOutput<Schema>
  >;
};
