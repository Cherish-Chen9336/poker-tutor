import { describe, expect, it } from "vitest";
import { countedPath, startCounting } from "./analytics";

describe("visit counting", () => {
  it("counts the page named after the #", () => {
    expect(countedPath("#/zh-Hans/learn/3")).toBe("/zh-Hans/learn/3");
    expect(countedPath("#/play")).toBe("/play");
    expect(countedPath("")).toBe("/");
    expect(countedPath("#")).toBe("/");
  });

  it("sends nothing from a local preview or a test", () => {
    const appended: unknown[] = [];
    const win = { location: { host: "localhost:5173", hash: "" }, document: { head: { append: (n: unknown) => appended.push(n) } } };
    startCounting("#toggle-goatcounter", win as never);
    expect(appended).toEqual([]);
    expect("goatcounter" in win).toBe(false);
  });

  /** A stand-in for the published site's window: records what GoatCounter would send. */
  function site(hash: string) {
    const sent: string[] = [];
    const storage = new Map<string, string>();
    const listeners: Record<string, () => void> = {};
    let onScriptLoad = () => {};
    const win = {
      location: { host: "cherish-chen9336.github.io", hash, pathname: "/poker-tutor/", search: "" },
      localStorage: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) },
      alert() {},
      history: { replaceState: (_: unknown, __: string, url: string) => { win.location.hash = url.includes("#") ? url.slice(url.indexOf("#")) : ""; } },
      addEventListener: (type: string, fn: () => void) => { listeners[type] = fn; },
      document: {
        createElement: () => ({ dataset: {}, addEventListener: (_: string, fn: () => void) => { onScriptLoad = fn; } }),
        head: { append() {} },
      },
      goatcounter: undefined as undefined | { count?: (v: { path: string }) => void },
    };
    const go = (to: string) => { win.location.hash = to; listeners.hashchange!(); };
    // What count.js does on loading: adds count(), which its filter skips when this browser opted out.
    const load = () => {
      win.goatcounter!.count = ({ path }) => { if (storage.get("skipgc") !== "t") sent.push(path); };
      onScriptLoad();
    };
    return { win, sent, storage, go, load };
  }

  it("on the published site, counts the first page and every later one, even before the script has loaded", () => {
    const s = site("#/zh-Hans/learn");
    startCounting("", s.win as never);
    s.go("#/zh-Hans/play");
    expect(s.sent).toEqual([]);
    s.load();
    expect(s.sent).toEqual(["/zh-Hans/learn", "/zh-Hans/play"]);
    s.go("#/zh-Hans/review");
    expect(s.sent).toEqual(["/zh-Hans/learn", "/zh-Hans/play", "/zh-Hans/review"]);
  });

  it("#toggle-goatcounter stops and restarts counting this browser, at startup or on an open page", () => {
    const s = site("#toggle-goatcounter");
    startCounting("#toggle-goatcounter", s.win as never);
    expect(s.storage.get("skipgc")).toBe("t");
    expect(s.win.location.hash).toBe(""); // cleared, so count.js doesn't flip it back
    s.load();
    s.go("#/play");
    expect(s.sent).toEqual([]);
    s.go("#toggle-goatcounter");
    expect(s.storage.has("skipgc")).toBe(false);
    s.go("#/play");
    expect(s.sent).toEqual(["/play"]);
  });

  it("doesn't count visits from while this browser was opted out, even if it opts back in before the script loads", () => {
    const s = site("#/learn");
    s.storage.set("skipgc", "t");
    startCounting("", s.win as never);
    s.go("#/review");
    s.go("#toggle-goatcounter"); // opts back in
    s.go("#/play");
    s.load();
    expect(s.sent).toEqual(["/play"]);
  });

  it("keeps an address the language redirect already set", () => {
    const s = site("#/ja/learn"); // opened at #toggle-goatcounter, then redirected to the saved language
    startCounting("#toggle-goatcounter", s.win as never);
    expect(s.storage.get("skipgc")).toBe("t");
    expect(s.win.location.hash).toBe("#/ja/learn");
  });
});
