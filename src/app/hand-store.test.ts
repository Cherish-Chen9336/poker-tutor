import { describe, expect, it } from "vitest";
import type { HandRecord, RecordedMove } from "../game/match";
import type { TableView } from "../game/types";
import { practiceBot } from "../game/bot";
import { Match } from "../game/match";
import { compact, expand, isHandRecord, upgrade, loadHands, MAX_BYTES, MAX_HANDS, saveHands, trimHands } from "./hand-store";

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
  const legal = { fold: true, check: true, call: null, bet: { min: 2, max: 198 }, raise: null };
  const move: RecordedMove = { actorSeat: 0, move: { type: "check" }, view: view(), after: view(), legal };
  return {
    version: 2, id: `h${n}`, botVersion: "bot-1", learnerSeat: 0,
    seats: [{ seat: 0, name: "You", learner: true }, { seat: 1, name: "Bot", learner: false }],
    matchNumber: 1, handNumber: n, startStacks: [200, 200], toppedUp: [],
    moves: [move], final: { ...view("x".repeat(padding)), handOver: true, winners: [{ seat: 0, amount: 4, bestHand: null, description: null }] }, net: 0,
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
    // Codex's verification cases: each of these used to pass the checks and crash Review.
    const good = record(1);
    const withView = (change: Partial<TableView>) => ({ ...good, moves: [{ ...good.moves[0], view: { ...good.moves[0].view, ...change } }] });
    expect(isHandRecord(withView({ seats: [null, null] }))).toBe(false);
    expect(isHandRecord(withView({ viewerSeat: undefined as never }))).toBe(false);
    expect(isHandRecord(withView({ board: ["XX", "7d", "9h"] }))).toBe(false);
    expect(isHandRecord(withView({ pots: [null as never] }))).toBe(false);
    expect(isHandRecord({ ...good, moves: [{ ...good.moves[0], move: { type: "dance" } as never }] })).toBe(false);
    expect(isHandRecord({ ...good, final: { ...good.final!, handOver: false } })).toBe(false);
    // Codex's second round.
    expect(isHandRecord(withView({ viewerSeat: 99 }))).toBe(false);
    expect(isHandRecord(withView({ viewerSeat: 0.5 }))).toBe(false);
    expect(isHandRecord({ ...good, final: { ...good.final!, winners: [{ seat: 0, amount: 4, bestHand: null, description: 123 as never }] } })).toBe(false);
    expect(isHandRecord({ ...good, moves: [{ ...good.moves[0], legal: { ...good.moves[0].legal!, check: "false" as never } }] })).toBe(false);
    expect(isHandRecord({ ...good, moves: [{ ...good.moves[0], legal: null }] })).toBe(false); // the learner's moves always have legal moves
    // Codex's third round: seat numbers must be 0 or 1 and match their position.
    const seats = good.moves[0].view.seats;
    expect(isHandRecord(withView({ seats: [{ ...seats[0]!, seat: 99 }, seats[1]] }))).toBe(false);
    expect(isHandRecord(withView({ buttonSeat: 99 }))).toBe(false);
    expect(isHandRecord(withView({ pots: [{ amount: 4, eligibleSeats: [0, 7] }] }))).toBe(false);
  });

  it("drops a single record too big to fit, and trims when loading", () => {
    expect(trimHands([record(1, 600_000), record(2)]).map((h) => h.id)).toEqual(["h2"]);
    const storage = memoryStorage();
    storage.setItem("poker-tutor:hands", JSON.stringify({ version: 1, hands: Array.from({ length: 70 }, (_, i) => record(i)) }));
    expect(loadHands(storage)).toHaveLength(MAX_HANDS);
  });

  it("accepts every real hand recorded by a match", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const match = new Match({ bot: practiceBot, random, botRandom: random });
    for (let n = 0; n < 200; n++) {
      match.dealNext();
      while (!match.handOver) {
        const legal = match.legalMoves()!;
        const pick = random();
        match.act(pick < 0.15 ? { type: "fold" } : legal.check ? { type: "check" } : pick < 0.3 && legal.raise ? { type: "raise", to: legal.raise.max } : { type: "call" });
      }
      const saved = JSON.parse(JSON.stringify({ ...match.current!, id: `r${n}`, playedAt: "2026-10-31T00:00:00Z" }));
      expect(isHandRecord(saved), `hand ${n}`).toBe(true);
    }
  });

  it("converts hands saved in the old heads-up format", () => {
    const current = record(7);
    const { learnerSeat: _l, seats: _s, toppedUp: _t, ...rest } = current;
    void _l; void _s; void _t;
    const old = { ...rest, version: 1, moves: current.moves.map(({ actorSeat, ...m }) => ({ ...m, who: actorSeat === 0 ? "you" : "bot" })) };
    const storage = memoryStorage();
    storage.setItem("poker-tutor:hands", JSON.stringify({ version: 1, hands: [old] }));
    const loaded = loadHands(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(current);
    expect(isHandRecord(upgrade({ ...old, moves: [{ ...old.moves[0], who: "someone" }] }))).toBe(false);
    // Newly saved hands use the new format.
    saveHands(storage, loaded);
    expect(JSON.parse(storage.getItem("poker-tutor:hands")!).version).toBe(2);
  });

  it("accepts six-seat hands and checks their seat references", () => {
    let seed = 11;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // bot-1 is heads-up only; a simple stand-in plays the five bots until bot-2 exists.
    const caller = (_view: unknown, legal: { check: boolean; call: number | null; raise: { max: number } | null }) =>
      legal.check ? { type: "check" as const } : random() < 0.3 && legal.raise ? { type: "raise" as const, to: legal.raise.max } : { type: "call" as const };
    const match = new Match({ bot: caller, players: 6, random, botRandom: random });
    let toppedUp = 0;
    for (let n = 0; n < 150; n++) {
      match.dealNext();
      while (!match.handOver) {
        const legal = match.legalMoves()!;
        match.act(legal.check ? { type: "check" } : random() < 0.4 ? { type: "fold" } : legal.raise && random() < 0.2 ? { type: "raise", to: legal.raise.max } : { type: "call" });
      }
      toppedUp += match.current!.toppedUp.length;
      const saved = JSON.parse(JSON.stringify({ ...match.current!, id: `s${n}` }));
      expect(isHandRecord(saved), `hand ${n}`).toBe(true);
      expect(isHandRecord({ ...saved, toppedUp: [0] })).toBe(false); // the learner is never topped up
      expect(isHandRecord({ ...saved, moves: saved.moves.map((m: { actorSeat: number }) => ({ ...m, actorSeat: 9 })) })).toBe(saved.moves.length === 0);
    }
    expect(toppedUp).toBeGreaterThan(0);
  });

  it("rejects pot results whose payouts don't add up (Codex's Step 6 audit)", () => {
    const good = record(1);
    const withPots = (potResults: unknown) => ({ ...good, final: { ...good.final!, potResults } });
    expect(isHandRecord(withPots([{ amount: 4, eligibleSeats: [0, 1], winners: [{ seat: 0, amount: 4 }] }]))).toBe(true);
    expect(isHandRecord(withPots([{ amount: 1, eligibleSeats: [0, 1], winners: [{ seat: 1, amount: 999 }] }]))).toBe(false);
    expect(isHandRecord(withPots([{ amount: 4, eligibleSeats: [0], winners: [{ seat: 1, amount: 4 }] }]))).toBe(false); // not eligible
    expect(isHandRecord(withPots([{ amount: 4, eligibleSeats: [0, 1], winners: [{ seat: 0, amount: 2 }, { seat: 0, amount: 2 }] }]))).toBe(false); // twice
    expect(isHandRecord(withPots([{ amount: 4, eligibleSeats: [0, 1], winners: [{ seat: 0, amount: 4.5 }] }]))).toBe(false);
  });

  it("stores a long legal six-player hand within the limits (Codex's Step 6 audit)", () => {
    // Deep stacks and minimum raises: over 200 moves.
    const minRaise = (_v: unknown, legal: { check: boolean; raise: { min: number; max: number } | null }) =>
      legal.raise && legal.raise.min < legal.raise.max ? { type: "raise" as const, to: legal.raise.min } : legal.check ? { type: "check" as const } : { type: "call" as const };
    const match = new Match({ bot: minRaise, players: 6, startingStack: 400, random: () => 0.4, botRandom: () => 0.4 });
    match.dealNext();
    while (!match.handOver) match.act(minRaise(null, match.legalMoves()!));
    const long = { ...match.current!, id: "long" };
    expect(long.moves.length).toBeGreaterThan(200);
    expect(JSON.stringify(long).length * 2).toBeGreaterThan(MAX_BYTES / 4); // too big uncompacted
    expect(JSON.stringify(compact(long)).length * 2).toBeLessThan(MAX_BYTES / 4);
    expect(expand(JSON.parse(JSON.stringify(compact(long))))).toEqual(JSON.parse(JSON.stringify(long)));
    expect(trimHands([long])).toHaveLength(1);
    // Round trip through storage.
    const storage = memoryStorage();
    expect(saveHands(storage, [long])).toBe(true);
    expect(loadHands(storage)).toEqual([JSON.parse(JSON.stringify(long))]);
  });
});
