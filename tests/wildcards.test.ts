import { describe, expect, it } from "vitest";
import type { WildcardPathValue } from "../src";
import { getManyByPath, safePath } from "../src";

/** Compile-time assertion helpers — failures surface in `pnpm typecheck`. */
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

describe("getMany (wildcard paths)", () => {
  const getTestObj = () => ({
    users: [
      { name: "Alice", age: 30, tags: ["admin", "dev"] },
      { name: "Bob", age: 25, tags: ["dev"] },
      { name: "Chloé", age: 35, tags: [] },
    ],
    settings: {
      colors: { primary: "blue", accent: "coral" },
    },
  });

  it("should collect values across an array wildcard", () => {
    const sp = safePath(getTestObj());

    expect(sp.getMany("users.*.name")).toEqual(["Alice", "Bob", "Chloé"]);
    expect(sp.getMany("users.*.age")).toEqual([30, 25, 35]);
  });

  it("should collect values across a record/object wildcard", () => {
    const sp = safePath(getTestObj());

    expect(sp.getMany("settings.colors.*")).toEqual(["blue", "coral"]);
  });

  it("should support nested wildcards, flattened", () => {
    const sp = safePath(getTestObj());

    expect(sp.getMany("users.*.tags.*")).toEqual(["admin", "dev", "dev"]);
  });

  it("should skip elements where the path is missing", () => {
    const sp = safePath({
      items: [{ id: 1 }, {}, { id: 3 }] as { id?: number }[],
    });

    expect(sp.getMany("items.*.id")).toEqual([1, 3]);
  });

  it("should behave like get for paths without wildcards", () => {
    const sp = safePath(getTestObj());

    expect(sp.getMany("users.0.name")).toEqual(["Alice"]);
    expect(sp.getMany("users.9.name" as never)).toEqual([]);
  });

  it("should never expose forbidden keys, even through a wildcard segment", () => {
    const obj: Record<string, unknown> = { a: { v: 1 }, b: { v: 2 } };
    const sp = safePath(obj);

    expect(sp.getMany("__proto__.v" as never)).toEqual([]);
    expect(sp.getMany("constructor.*" as never)).toEqual([]);
    // wildcard only iterates own enumerable values
    expect(sp.getMany("*.v")).toEqual([1, 2]);
  });

  it("should work on the standalone function", () => {
    const obj = getTestObj();

    expect(getManyByPath(obj, "users.*.name")).toEqual([
      "Alice",
      "Bob",
      "Chloé",
    ]);
  });
});

// ── Type-level assertions ─────────────────────────────────────────────────
interface Data {
  dict: Record<string, { score: number }>;
  matrix: number[][];
  users: { name: string; age: number }[];
}
export type wildcardCases = [
  Expect<Equal<WildcardPathValue<Data, "users.*.name">, string>>,
  Expect<Equal<WildcardPathValue<Data, "users.*.age">, number>>,
  Expect<Equal<WildcardPathValue<Data, "dict.*.score">, number>>,
  Expect<Equal<WildcardPathValue<Data, "matrix.*.*">, number>>,
  Expect<Equal<WildcardPathValue<Data, "users.0.name">, string>>,
];

describe("WildcardPathValue (runtime smoke test)", () => {
  it("should infer the element type through wildcards", () => {
    const data: Data = {
      users: [{ name: "Alice", age: 30 }],
      dict: { a: { score: 10 } },
      matrix: [
        [1, 2],
        [3, 4],
      ],
    };
    const sp = safePath(data);

    const names: string[] = sp.getMany("users.*.name");
    const scores: number[] = sp.getMany("dict.*.score");
    const cells: number[] = sp.getMany("matrix.*.*");

    expect(names).toEqual(["Alice"]);
    expect(scores).toEqual([10]);
    expect(cells).toEqual([1, 2, 3, 4]);

    // @ts-expect-error — 'users.*.invalid' does not lead to a value
    sp.getMany("users.*.invalid");
  });
});
