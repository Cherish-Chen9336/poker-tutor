import { describe, expect, it } from "vitest";
import { parseRoute, routeHref, type Route } from "./route";

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
