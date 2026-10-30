// Adapter tests: legal moves, hidden cards, fixed deals, and a randomized
// cross-check that the adapter's legal moves agree with the engine's rules.
import { describe, expect, it } from "vitest";
import { PokerEngine } from "@pokertools/engine/browser";
import { ActionType, type Action } from "@pokertools/types";
import { Table } from "./table";
import type { LegalMoves, Move, TableView } from "./types";

const DRY_BOARD = ["2c", "7d", "9h", "4s", "Jc"];

function newTable(stacks: number[], random?: () => number): Table {
  return new Table({
    smallBlind: 1,
    bigBlind: 2,
    seats: stacks.map((stack, seat) => ({ id: `p${seat}`, name: `Player ${seat}`, stack })),
    random,
  });
}

/** Seeded random numbers, so a failing run can be reproduced exactly. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function chipsOnTable(view: TableView): number {
  const seats = view.seats.reduce((sum, s) => sum + (s ? s.stack + s.betThisStreet : 0), 0);
  return seats + view.pots.reduce((sum, pot) => sum + pot.amount, 0);
}

describe("fixed deals and hidden cards", () => {
  it("deals the chosen cards and shows each player only their own", () => {
    const table = newTable([200, 200, 200]);
    table.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], board: DRY_BOARD });

    const mine = table.view(0);
    expect(mine.seats[0]!.cards).toEqual(["As", "Ah"]);
    expect(mine.seats[1]!.cards).toBeNull();
    expect(mine.seats[2]!.cards).toBeNull();
    expect(table.view(null).seats.map((s) => s!.cards)).toEqual([null, null, null]);
    expect(table.view(1).seats[1]!.cards).toEqual(["Ks", "Kh"]);
    expect(mine.board).toEqual([]); // the board isn't dealt yet

    table.move(0, { type: "call" });
    table.move(1, { type: "call" });
    table.move(2, { type: "check" });
    expect(table.view(0).board).toEqual(DRY_BOARD.slice(0, 3));
  });

  it("reveals the winner's cards at showdown, but not when everyone else folded", () => {
    const table = newTable([200, 200]);
    table.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"]], board: DRY_BOARD });
    table.move(0, { type: "raise", to: 200 });
    table.move(1, { type: "call" });
    const shown = table.view(null);
    expect(shown.handOver).toBe(true);
    expect(shown.seats[0]!.cards).toEqual(["As", "Ah"]);
    // The app shows every hand at a showdown, including the loser's.
    expect(shown.seats[1]!.cards).toEqual(["Ks", "Kh"]);
    expect(shown.winners).toEqual([expect.objectContaining({ seat: 0, amount: 400 })]);
    expect(shown.winners![0].description).toMatch(/Pair/);
    expect(table.netResults()).toEqual([200, -200]);

    const folded = newTable([200, 200]);
    folded.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"]], board: DRY_BOARD });
    folded.move(0, { type: "fold" });
    const after = folded.view(null);
    expect(after.seats.map((s) => s!.cards)).toEqual([null, null]);
    expect(after.winners).toEqual([{ seat: 1, amount: 2, bestHand: null, description: null }]);
    expect(folded.netResults()).toEqual([-1, 1]);
  });

  it("never shows a folded player's cards, even when others reach a showdown", () => {
    const table = newTable([200, 200, 200]);
    table.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], board: DRY_BOARD });
    table.move(0, { type: "fold" });
    table.move(1, { type: "call" });
    table.move(2, { type: "check" });
    for (let i = 0; i < 3; i++) {
      table.move(1, { type: "check" });
      table.move(2, { type: "check" });
    }
    const view = table.view(1);
    expect(view.handOver).toBe(true);
    expect(view.seats.map((s) => s!.cards)).toEqual([null, ["Ks", "Kh"], ["Qs", "Qh"]]);
  });

  it("reports results when posting the blinds already ends the hand", () => {
    const table = newTable([1, 1]);
    table.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"]], board: DRY_BOARD });
    expect(table.view(null).handOver).toBe(true);
    expect(table.netResults()).toEqual([1, -1]);
  });

  it("lists only players who haven't folded as able to win a pot", () => {
    const table = newTable([200, 200, 200]);
    table.dealHand();
    table.move(0, { type: "call" });
    table.move(1, { type: "call" });
    table.move(2, { type: "check" });
    table.move(1, { type: "bet", to: 2 });
    table.move(2, { type: "fold" });
    expect(table.view(null).pots).toEqual([{ amount: 6, eligibleSeats: [0, 1] }]);
  });

  it("rejects fixed deals with missing, unknown, or repeated cards", () => {
    const table = newTable([200, 200]);
    expect(() => table.dealHand({ hands: [["As", "Ah"]], board: DRY_BOARD })).toThrow();
    expect(() => table.dealHand({ hands: [["As", "Ah"], ["As", "Kh"]], board: DRY_BOARD })).toThrow();
    expect(() => table.dealHand({ hands: [["As", "Ah"], ["1s", "Kh"]], board: DRY_BOARD })).toThrow();
  });

  it("shuffles with the real random source again after a fixed deal", () => {
    let calls = 0;
    const counted = () => {
      calls++;
      return 0.5;
    };
    const table = newTable([200, 200], counted);
    table.dealHand({ hands: [["As", "Ah"], ["Ks", "Kh"]], board: DRY_BOARD });
    expect(calls).toBe(1); // only the hand ID; the shuffle used the fixed deal
    table.move(0, { type: "fold" });
    table.dealHand();
    expect(calls).toBe(1 + 51 + 1); // a full shuffle, then the hand ID
  });

  it("refuses tables of 3 or more players with an empty seat", () => {
    const table = new Table({
      smallBlind: 1,
      bigBlind: 2,
      seats: [{ id: "a", name: "A", stack: 200 }, null, { id: "c", name: "C", stack: 200 }, { id: "d", name: "D", stack: 200 }],
    });
    expect(() => table.dealHand()).toThrow(/empty seats/);
  });
});

describe("legal moves", () => {
  it("before the flop: call the big blind or raise to at least 4", () => {
    const table = newTable([200, 200, 200]);
    table.dealHand();
    expect(table.legalMoves(1)).toBeNull(); // not seat 1's turn
    expect(table.legalMoves(0)).toEqual({
      fold: true,
      check: false,
      call: 2,
      bet: null,
      raise: { min: 4, max: 200 },
    });
    table.move(0, { type: "call" });
    table.move(1, { type: "call" });
    // The big blind's option: check or raise.
    expect(table.legalMoves(2)).toEqual({ fold: true, check: true, call: null, bet: null, raise: { min: 4, max: 200 } });
  });

  it("after the flop: check or bet at least the big blind", () => {
    const table = newTable([200, 200]);
    table.dealHand();
    table.move(0, { type: "call" });
    table.move(1, { type: "check" });
    expect(table.legalMoves(1)).toEqual({ fold: true, check: true, call: null, bet: { min: 2, max: 198 }, raise: null });
  });

  it("calling for less than the bet puts a short stack all-in", () => {
    const table = newTable([200, 30]);
    table.dealHand();
    table.move(0, { type: "raise", to: 100 });
    expect(table.legalMoves(1)).toEqual({ fold: true, check: false, call: 28, bet: null, raise: null });
  });

  it("no raise after a short all-in for players who already acted", () => {
    const table = newTable([122, 500, 500]);
    table.dealHand();
    table.move(0, { type: "call" });
    table.move(1, { type: "call" });
    table.move(2, { type: "check" });
    table.move(1, { type: "bet", to: 100 });
    table.move(2, { type: "call" });
    table.move(0, { type: "raise", to: 120 }); // all-in, only 20 more
    expect(table.legalMoves(1)).toEqual({ fold: true, check: false, call: 20, bet: null, raise: null });
  });

  it("no betting when every opponent is all-in: only call or fold", () => {
    const table = newTable([200, 100]);
    table.dealHand();
    table.move(0, { type: "call" });
    table.move(1, { type: "raise", to: 100 }); // all-in
    expect(table.legalMoves(0)).toEqual({ fold: true, check: false, call: 98, bet: null, raise: null });
  });

  it("ends the betting when the last other player with chips folds (found by Codex)", () => {
    // Seats 0 and 1 go all-in before the flop. On the turn seat 2 folds, which
    // leaves seat 3 with nobody to bet against: the board should just run out.
    const table = newTable([50, 30, 200, 200], seededRandom(1));
    table.dealHand();
    table.move(3, { type: "raise", to: 50 });
    table.move(0, { type: "call" });
    table.move(1, { type: "call" });
    table.move(2, { type: "call" });
    table.move(2, { type: "bet", to: 50 });
    table.move(3, { type: "call" });
    expect(table.move(2, { type: "fold" })).toEqual({ ok: true });
    const view = table.view(null);
    expect(view.actionTo).toBeNull();
    expect(view.handOver).toBe(true);
    expect(view.board).toHaveLength(5);
    expect(chipsOnTable(view)).toBe(480);
  });

  it("rejected moves explain why and change nothing", () => {
    const table = newTable([200, 200, 200]);
    table.dealHand();
    const before = JSON.stringify(table.view(null));
    const rejected: [number, Move][] = [
      [1, { type: "call" }], // not their turn
      [0, { type: "check" }],
      [0, { type: "bet", to: 10 }],
      [0, { type: "raise", to: 3 }],
      [0, { type: "raise", to: 201 }],
      [0, { type: "raise", to: 4.5 }],
    ];
    for (const [seat, move] of rejected) {
      const result = table.move(seat, move);
      expect(result.ok, JSON.stringify(move)).toBe(false);
    }
    expect(table.move(0, { type: "raise", to: 3 })).toEqual({ ok: false, reason: "The smallest raise here is 4." });
    expect(JSON.stringify(table.view(null))).toBe(before);
  });
});

describe("randomized cross-check against the engine", () => {
  /** The engine's own verdict on a move, using the table's engine. */
  function engineAccepts(engine: PokerEngine, seat: number, move: Move): boolean {
    const playerId = engine.state.players[seat]!.id;
    const types = { fold: ActionType.FOLD, check: ActionType.CHECK, call: ActionType.CALL, bet: ActionType.BET, raise: ActionType.RAISE };
    const action = ("to" in move ? { type: types[move.type], playerId, amount: move.to } : { type: types[move.type], playerId }) as Action;
    return engine.validate(action).valid;
  }

  function adapterAccepts(legal: LegalMoves, move: Move): boolean {
    if (move.type === "fold") return legal.fold;
    if (move.type === "check") return legal.check;
    if (move.type === "call") return legal.call !== null;
    const range = legal[move.type];
    return range !== null && move.to >= range.min && move.to <= range.max;
  }

  it("agrees on every move and amount over hundreds of random hands, and never loses chips", () => {
    // Shuffles and choices both come from this seed, so any failure is reproducible.
    // (Seeds 1–50 were also checked once, on 2026-10-29.)
    const random = seededRandom(42);
    let decisions = 0;
    let hands = 0;
    for (let game = 0; game < 80; game++) {
      const players = 2 + Math.floor(random() * 5);
      const stacks = Array.from({ length: players }, () => 5 + Math.floor(random() * 200));
      const startTotal = stacks.reduce((a, b) => a + b, 0);
      const table = newTable(stacks, random);
      // Reach into the adapter's engine only to ask it for verdicts.
      const engine = (table as unknown as { engine: PokerEngine }).engine;
      const trace: string[] = [];

      for (let hand = 0; hand < 15; hand++) {
        const funded = table.view(null).seats.filter((s) => s && s.stack > 0).length;
        // Stop at one player, or when a bust-out leaves a gap at a 3+ player table.
        if (funded < 2 || (funded >= 3 && funded < players)) break;
        table.dealHand();
        hands++;
        let view = table.view(null);
        while (view.actionTo !== null) {
          const seat = view.actionTo;
          const legal = table.legalMoves(seat)!;
          const seatView = view.seats[seat]!;
          const maxTo = seatView.betThisStreet + seatView.stack;
          const where = `game ${game}, hand ${hand}, seat ${seat} after: ${trace.join(", ")}`;
          const opponentsCanRespond = view.seats.some((s) => s && s.seat !== seat && s.status === "active" && s.stack > 0);

          // Compare every move type and every amount up to all-in.
          const candidates: Move[] = [{ type: "fold" }, { type: "check" }, { type: "call" }];
          for (let to = 0; to <= maxTo; to++) candidates.push({ type: "bet", to }, { type: "raise", to });
          for (const move of candidates) {
            // The engine quietly turns "bet" into "raise" once there's a bet (including the big
            // blind); the adapter keeps them separate, so compare only the one that applies.
            if (move.type === (legal.bet === null ? "bet" : "raise")) continue;
            // The adapter refuses bets nobody could answer; the engine allows them.
            if (move.type === "bet" || move.type === "raise") {
              if (!opponentsCanRespond) {
                expect(adapterAccepts(legal, move), where).toBe(false);
                continue;
              }
            }
            expect(adapterAccepts(legal, move), `${JSON.stringify(move)} in ${where}`).toBe(
              engineAccepts(engine, seat, move),
            );
          }

          // Play a random legal move, favoring calls and checks.
          const options: Move[] = [{ type: "fold" }];
          if (legal.check) options.push({ type: "check" }, { type: "check" });
          if (legal.call !== null) options.push({ type: "call" }, { type: "call" });
          for (const kind of ["bet", "raise"] as const) {
            const range = legal[kind];
            if (range) options.push({ type: kind, to: range.min + Math.floor(random() * (range.max - range.min + 1)) });
          }
          const choice = options[Math.floor(random() * options.length)];
          trace.push(`${seat} ${choice.type}${"to" in choice ? ` ${choice.to}` : ""}`);
          expect(table.move(seat, choice), where).toEqual({ ok: true });
          decisions++;

          view = table.view(null);
          expect(chipsOnTable(view), where).toBe(startTotal);
        }
        expect(view.handOver).toBe(true);
        expect(table.netResults().reduce((a, b) => a + b, 0)).toBe(0);
        trace.length = 0;
      }
    }
    expect(hands).toBeGreaterThan(200);
    expect(decisions).toBeGreaterThan(1000);
  });
});
