import { getProperty, setProperty } from "dot-prop";
import lodashGet from "lodash/get.js";
import lodashSet from "lodash/set.js";
import { bench, describe } from "vitest";
import { getValueByPath, setValueByPath } from "../src";

// Node 17+ global, absent from the ES2022 lib types.
declare const structuredClone: <T>(value: T) => T;

const makeObj = () => ({
  user: {
    profile: {
      address: {
        city: "Paris",
        geo: { lat: 48.8566, lng: 2.3522 },
      },
    },
  },
});

const obj = makeObj();

// Sink prevents dead-code elimination in the native baseline.
let sink: number | undefined;

describe("get — 5-level deep read", () => {
  bench("pathsafe getValueByPath", () => {
    getValueByPath(obj, "user.profile.address.geo.lat");
  });

  bench("lodash.get", () => {
    lodashGet(obj, "user.profile.address.geo.lat");
  });

  bench("dot-prop getProperty", () => {
    getProperty(obj, "user.profile.address.geo.lat");
  });

  bench("native optional chaining (baseline)", () => {
    sink = obj.user?.profile?.address?.geo?.lat ?? sink;
  });
});

describe("set — 5-level deep write", () => {
  bench("pathsafe setValueByPath", () => {
    setValueByPath(obj, "user.profile.address.geo.lat", 1);
  });

  bench("lodash.set", () => {
    lodashSet(obj, "user.profile.address.geo.lat", 1);
  });

  bench("dot-prop setProperty", () => {
    setProperty(obj, "user.profile.address.geo.lat", 1);
  });
});

describe("set — immutable 5-level deep write", () => {
  bench("pathsafe setValueByPath { immutable: true }", () => {
    setValueByPath(obj, "user.profile.address.geo.lat", 1, {
      immutable: true,
    });
  });

  bench("naive structuredClone + assign", () => {
    const copy = structuredClone(obj);
    copy.user.profile.address.geo.lat = 1;
  });
});
