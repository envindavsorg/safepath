import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { PathValidationError, safePath } from "../src";

describe("Standard Schema validation", () => {
  const getTestObj = () => ({
    user: {
      name: "John",
      age: 30,
      email: "john@example.com",
    },
  });

  describe("validate with Zod", () => {
    it("should validate a value at a path", () => {
      const sp = safePath(getTestObj());

      const result = sp.validate("user.email", z.string().email());

      expect(result.issues).toBeUndefined();
      if (!result.issues) {
        expect(result.value).toBe("john@example.com");
      }
    });

    it("should report issues for invalid values", () => {
      const sp = safePath(getTestObj());

      const result = sp.validate("user.name", z.string().min(10));

      expect(result.issues).toBeDefined();
      expect(result.issues?.length).toBeGreaterThan(0);
    });
  });

  describe("validate with Valibot", () => {
    it("should validate a value at a path", () => {
      const sp = safePath(getTestObj());

      const result = sp.validate("user.email", v.pipe(v.string(), v.email()));

      expect(result.issues).toBeUndefined();
      if (!result.issues) {
        expect(result.value).toBe("john@example.com");
      }
    });

    it("should report issues for invalid values", () => {
      const sp = safePath(getTestObj());

      const result = sp.validate(
        "user.age",
        v.pipe(v.number(), v.minValue(100))
      );

      expect(result.issues).toBeDefined();
    });
  });

  describe("validateAndSet", () => {
    it("should set the validated value", () => {
      const obj = getTestObj();
      const sp = safePath(obj);

      sp.validateAndSet("user.age", 25, z.number().min(0).max(120));

      expect(obj.user.age).toBe(25);
    });

    it("should apply schema transforms before setting", () => {
      const obj = getTestObj();
      const sp = safePath(obj);

      sp.validateAndSet(
        "user.name",
        "  Jane  ",
        z.string().transform((s) => s.trim())
      );

      expect(obj.user.name).toBe("Jane");
    });

    it("should throw PathValidationError in strict mode (default)", () => {
      const sp = safePath(getTestObj());

      expect(() =>
        sp.validateAndSet("user.age", -5, z.number().min(0))
      ).toThrow(PathValidationError);
    });

    it("should expose path and issues on the error", () => {
      const sp = safePath(getTestObj());

      try {
        sp.validateAndSet("user.age", -5, z.number().min(0));
        expect.unreachable();
      } catch (error) {
        expect(error).toBeInstanceOf(PathValidationError);
        const validationError = error as PathValidationError;
        expect(validationError.path).toBe("user.age");
        expect(validationError.issues.length).toBeGreaterThan(0);
      }
    });

    it("should return the object unchanged with strict: false", () => {
      const obj = getTestObj();
      const sp = safePath(obj);

      const result = sp.validateAndSet("user.age", -5, z.number().min(0), {
        strict: false,
      });

      expect(result).toBe(obj);
      expect(obj.user.age).toBe(30);
    });

    it("should work with Valibot schemas too", () => {
      const obj = getTestObj();
      const sp = safePath(obj);

      sp.validateAndSet("user.age", 42, v.pipe(v.number(), v.minValue(0)));

      expect(obj.user.age).toBe(42);
    });

    it("should support immutable mode", () => {
      const obj = getTestObj();
      const sp = safePath(obj);

      const result = sp.validateAndSet("user.age", 25, z.number(), {
        immutable: true,
      });

      expect(obj.user.age).toBe(30);
      expect(result.user.age).toBe(25);
    });
  });

  describe("async validation", () => {
    it("validate should throw a helpful error for async schemas", () => {
      const sp = safePath(getTestObj());
      const asyncSchema = z.string().refine(async () => true, "async check");

      expect(() => sp.validate("user.name", asyncSchema)).toThrow(
        /asynchronously/
      );
    });

    it("validateAsync should handle async schemas", async () => {
      const sp = safePath(getTestObj());
      const asyncSchema = z
        .string()
        .refine(async (s) => s.length > 2, "too short");

      const result = await sp.validateAsync("user.name", asyncSchema);

      expect(result.issues).toBeUndefined();
    });

    it("validateAndSetAsync should set after async validation", async () => {
      const obj = getTestObj();
      const sp = safePath(obj);
      const asyncSchema = z
        .number()
        .refine(async (n) => n >= 0, "must be positive");

      await sp.validateAndSetAsync("user.age", 50, asyncSchema);

      expect(obj.user.age).toBe(50);
    });
  });
});
