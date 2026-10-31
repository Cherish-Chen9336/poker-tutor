import { describe, expect, it } from "vitest";
import type { HandRecord, RecordedMove } from "../game/match";
import type { TableView } from "../game/types";
import { isHandRecord, loadHands, MAX_BYTES, MAX_HANDS, saveHands, trimHands } from "./hand-store";

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

function view(note = ""): TableView {
  return {
    viewerSeat: 0, handNumber: 1, street: "flop", board: ["2c", "7d", "9h"], pots: [{ amount: 4, eligibleSeats: [0, 1] }],
    seats: [
      { seat: 0, id: "you", name: note || "You", stack: 198, betThisStreet: 0, status: "active", cards: ["As", "Kd"] },
      { seat: 1, id: "bot", name: "Bot", stack: 198, betThisStreet: 0, status: "active", cards: null },
    ],
    buttonSeat: 0, bigBlindSeat: 1, smallBlind: 1, bigBlind: 2, actionTo: 1, handOver: false, winners: null,
  };
}

function record(n: number, padding = 0): HandRecord {
  const move: RecordedMove = { who: "you", move: { type: "check" }, view: view(), after: view(), legal: null };
  return {
    version: 1, id: `h${n}`, botVersion: "bot-1", matchNumber: 1, handNumber: n, startStacks: [200, 200],
    moves: [move], final: view("x".repeat(padding)), net: 0,
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
    const big = Array.from({ length: 10 }, (_, i) => record(i, 120_000)); // about 240 KB each as UTF-16
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

  it("rejects records that look right on top but would break the Review screen", () => {
    expect(isHandRecord(record(1))).toBe(true);
    expect(isHandRecord({ ...record(1), moves: [null] })).toBe(false);
    expect(isHandRecord({ ...record(1), final: {} })).toBe(false);
    expect(isHandRecord({ ...record(1), moves: [{ ...record(1).moves[0], after: { seats: "x" } }] })).toBe(false);
  });

  it("drops a single record too big to fit, and trims when loading", () => {
    expect(trimHands([record(1, 600_000), record(2)]).map((h) => h.id)).toEqual(["h2"]);
    const storage = memoryStorage();
    storage.setItem("poker-tutor:hands", JSON.stringify({ version: 1, hands: Array.from({ length: 70 }, (_, i) => record(i)) }));
    expect(loadHands(storage)).toHaveLength(MAX_HANDS);
  });
});
