import { describe, expect, it } from "vitest";
import type { HandRecord } from "../game/match";
import { loadHands, MAX_BYTES, MAX_HANDS, saveHands, trimHands } from "./hand-store";

function memoryStorage(fail = false): Storage {
  const data = new Map<string, string>();
  const guard = () => {
    if (fail) throw new DOMException("Storage is full", "QuotaExceededError");
  };
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => { guard(); data.delete(key); },
    setItem: (key, value) => { guard(); data.set(key, value); },
  };
}

function record(n: number, padding = 0): HandRecord {
  return {
    version: 1,
    id: `h${n}`,
    botVersion: "bot-1",
    matchNumber: 1,
    handNumber: n,
    startStacks: [200, 200],
    moves: [],
    final: { padding: "x".repeat(padding) } as unknown as HandRecord["final"],
    net: 0,
  };
}

describe("saved hands", () => {
  it("saves and loads hands", () => {
    const storage = memoryStorage();
    expect(saveHands(storage, [record(1), record(2)])).toBe(true);
    expect(loadHands(storage).map((h) => h.id)).toEqual(["h1", "h2"]);
  });

  it("keeps only the newest 50 hands", () => {
    const many = Array.from({ length: 60 }, (_, i) => record(i));
    const kept = trimHands(many);
    expect(kept).toHaveLength(MAX_HANDS);
    expect(kept[0].id).toBe("h10");
  });

  it("drops the oldest hands to stay under about 2 MiB", () => {
    const big = Array.from({ length: 10 }, (_, i) => record(i, 200_000)); // about 400 KB each as UTF-16
    const kept = trimHands(big);
    expect(kept.length).toBeLessThan(10);
    expect(JSON.stringify({ version: 1, hands: kept }).length * 2).toBeLessThanOrEqual(MAX_BYTES);
    expect(kept.at(-1)!.id).toBe("h9");
  });

  it("reports a refused save and ignores unreadable data", () => {
    expect(saveHands(memoryStorage(true), [record(1)])).toBe(false);
    expect(saveHands(null, [record(1)])).toBe(false);
    const storage = memoryStorage();
    for (const raw of ["{oops", '{"version":2,"hands":[]}', '{"version":1,"hands":[{"id":3}]}']) {
      storage.setItem("poker-tutor:hands", raw);
      expect(loadHands(storage)).toEqual([]);
    }
  });
});
