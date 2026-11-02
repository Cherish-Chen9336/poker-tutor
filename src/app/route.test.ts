import { describe, expect, it } from "vitest";
import { parseLocation, parseRoute, routeHref, type Route } from "./route";

describe("parseRoute", () => {
  it("reads each area", () => {
    expect(parseRoute("#/learn")).toEqual({ area: "learn", lesson: null });
    expect(parseRoute("#/learn/3")).toEqual({ area: "learn", lesson: 3 });
    expect(parseRoute("#/play")).toEqual({ area: "play" });
    expect(parseRoute("#/review")).toEqual({ area: "review" });
  });

  it("sends empty and unknown addresses to the lesson list", () => {
    for (const hash of ["", "#", "#/", "#/nope", "#/learn/0", "#/learn/-1", "#/learn/2.5", "#/learn/x", "#/learn/3/4", "#/play/1"]) {
      expect(parseRoute(hash), hash).toEqual({ area: "learn", lesson: null });
    }
  });

  it("round-trips with routeHref", () => {
    const routes: Route[] = [{ area: "learn", lesson: null }, { area: "learn", lesson: 10 }, { area: "play" }, { area: "review" }];
    for (const route of routes) expect(parseRoute(routeHref(route))).toEqual(route);
  });
});

describe("parseLocation", () => {
  it("reads an optional language in front, and keeps old links English", () => {
    expect(parseLocation("#/learn/3")).toEqual({ locale: "en", route: { area: "learn", lesson: 3 } });
    expect(parseLocation("#/en/play")).toEqual({ locale: "en", route: { area: "play" } });
    expect(parseLocation("#/zh-Hans/learn/1")).toEqual({ locale: "zh-Hans", route: { area: "learn", lesson: 1 } });
    expect(parseLocation("#/ja")).toEqual({ locale: "ja", route: { area: "learn", lesson: null } });
    // Traditional Chinese and unknown codes aren't treated as Simplified Chinese: they're just unknown pages.
    expect(parseLocation("#/zh-Hant/learn/1")).toEqual({ locale: "en", route: { area: "learn", lesson: null } });
  });

  it("round-trips with routeHref in every language", () => {
    const routes: Route[] = [{ area: "learn", lesson: null }, { area: "learn", lesson: 10 }, { area: "play" }, { area: "review" }];
    for (const locale of ["en", "zh-Hans", "ja"] as const) {
      for (const route of routes) expect(parseLocation(routeHref(route, locale))).toEqual({ locale, route });
    }
    expect(routeHref({ area: "learn", lesson: 2 })).toBe("#/learn/2");
  });
});
