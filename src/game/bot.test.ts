import { describe, expect, it } from "vitest";
import { inLimpSet, inRaiseSet, inValueSet, isPremium, practiceBot, startOf } from "./bot";
import { Match } from "./match";
import { sizedTo } from "./pot-math";
import { Table } from "./table";
import type { LegalMoves, Move, TableView } from "./types";

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DECK = "23456789TJQKA".split("").flatMap((r) => "shdc".split("").map((s) => r + s));

function share(test: (hole: string[]) => boolean): number {
  let yes = 0;
  let all = 0;
  for (let i = 0; i < 52; i++) {
    for (let j = i + 1; j < 52; j++) {
      all++;
      if (test([DECK[i], DECK[j]])) yes++;
    }
  }
  return yes / all;
}

describe("bot starting-hand chart", () => {
  it("raises 59.3% of hands on the button and plays 74.7% in total", () => {
    expect((share((h) => inRaiseSet(startOf(h))) * 100).toFixed(1)).toBe("59.3");
    expect((share((h) => inRaiseSet(startOf(h)) || inLimpSet(startOf(h))) * 100).toFixed(1)).toBe("74.7");
  });

  it("classifies example hands", () => {
    expect(inRaiseSet(startOf(["Qc", "8d"]))).toBe(true);
    expect(inRaiseSet(startOf(["Qc", "7d"]))).toBe(false);
    expect(inLimpSet(startOf(["Qc", "7d"]))).toBe(true);
    expect(inLimpSet(startOf(["7c", "2d"]))).toBe(false);
    expect(inValueSet(startOf(["Tc", "Td"]))).toBe(true);
    expect(isPremium(startOf(["Ac", "Kd"]))).toBe(true);
    expect(isPremium(startOf(["Jc", "Jd"]))).toBe(false);
  });
});

/** The learner's side in these tests: a fixed, simple policy. */
type Learner = (legal: LegalMoves, view: TableView, random: () => number) => Move;
const checkCall: Learner = (legal) => (legal.check ? { type: "check" } : { type: "call" });
const minRaiser: Learner = (legal) =>
  legal.raise ? { type: "raise", to: legal.raise.min } : legal.bet ? { type: "bet", to: legal.bet.min } : checkCall(legal, null!, null!);
const halfPot: Learner = (legal, view) => {
  const to = sizedTo(view, 0, legal, 0.5);
  if (legal.bet && to !== null) return { type: "bet", to };
  return checkCall(legal, view, null!);
};
const shover: Learner = (legal) =>
  legal.raise ? { type: "raise", to: legal.raise.max } : legal.bet ? { type: "bet", to: legal.bet.max } : checkCall(legal, null!, null!);
const randomLearner: Learner = (legal, _view, random) => {
  const options: Move[] = [];
  if (legal.check) options.push({ type: "check" });
  if (legal.call !== null) options.push({ type: "call" }, { type: "fold" });
  if (legal.bet) options.push({ type: "bet", to: legal.bet.min + Math.floor(random() * (legal.bet.max - legal.bet.min + 1)) });
  if (legal.raise) options.push({ type: "raise", to: legal.raise.min + Math.floor(random() * (legal.raise.max - legal.raise.min + 1)) });
  return options[Math.floor(random() * options.length)];
};

describe("practice bot", () => {
  it("never chooses an illegal move, and simple one-trick styles don't beat it", () => {
    const results: Record<string, number> = {};
    for (const [name, learner] of Object.entries({ checkCall, minRaiser, halfPot, shover, randomLearner })) {
      const random = seeded(name.length * 7919);
      const match = new Match({ bot: practiceBot, random: seeded(name.length * 31), botRandom: seeded(name.length * 97) });
      let net = 0;
      for (let n = 0; n < 1500; n++) {
        match.dealNext(); // throws if the bot ever picks an illegal move
        while (!match.handOver) expect(match.act(learner(match.legalMoves()!, match.view(), random))).toEqual({ ok: true });
        net += match.current!.net!;
      }
      results[name] = net / 1500 / 2; // the learner's average result per hand, in big blinds
    }
    // None of these one-trick styles should beat the bot (fixed seeds, so this is repeatable).
    // An always-all-in player used to win before the bot widened its calls against big raises.
    for (const [name, bbPerHand] of Object.entries(results)) expect(bbPerHand, name).toBeLessThan(0);
  });

  it("decides the same way whatever the hidden cards are", () => {
    // Same bot cards, same flop, same visible moves; only the learner's cards and the turn and river differ.
    const variants = [
      { hands: [["2c", "3d"], ["Ah", "Kh"]], board: ["Kd", "9h", "4h", "2s", "7c"] },
      { hands: [["Qs", "Qd"], ["Ah", "Kh"]], board: ["Kd", "9h", "4h", "Jc", "3h"] },
      { hands: [["9c", "9d"], ["Ah", "Kh"]], board: ["Kd", "9h", "4h", "Ts", "8d"] },
    ];
    const decisions = variants.map((deal) => {
      const table = new Table({ seats: [{ id: "you", name: "You", stack: 200 }, { id: "bot", name: "Bot", stack: 200 }], smallBlind: 1, bigBlind: 2 });
      table.dealHand(deal);
      const random = seeded(42);
      const moves: string[] = [];
      while (!table.view(null).handOver && table.view(null).board.length <= 3) {
        const seat = table.view(null).actionTo!;
        const move = seat === 1 ? practiceBot(table.view(1), table.legalMoves(1)!, random, []) : checkCall(table.legalMoves(0)!, table.view(0), random);
        if (seat === 1) moves.push(JSON.stringify(move));
        expect(table.move(seat, move).ok).toBe(true);
      }
      return moves;
    });
    expect(decisions[0].length).toBeGreaterThan(0);
    expect(decisions[1]).toEqual(decisions[0]);
    expect(decisions[2]).toEqual(decisions[0]);
  });
});

describe("practice bot never folds an unbeatable hand (Codex's Step 5 audit)", () => {
  function botView(hole: string[], board: string[]): TableView {
    return {
      viewerSeat: 1,
      handNumber: 1,
      street: board.length === 4 ? "turn" : "river",
      board,
      pots: [{ amount: 40, eligibleSeats: [0, 1] }],
      seats: [
        { seat: 0, id: "you", name: "You", stack: 120, betThisStreet: 60, status: "active", cards: null },
        { seat: 1, id: "bot", name: "Bot", stack: 180, betThisStreet: 0, status: "active", cards: hole },
      ],
      buttonSeat: 0,
      bigBlindSeat: 1,
      smallBlind: 1,
      bigBlind: 2,
      actionTo: 1,
      handOver: false,
      winners: null,
    };
  }
  const facing60: LegalMoves = { fold: true, check: false, call: 60, bet: null, raise: { min: 120, max: 180 } };

  for (const [hole, board] of [
    [["As", "Ks"], ["Qs", "Js", "Ts", "Qd"]], // a royal flush on a paired board
    [["Ac", "2d"], ["Ks", "Kh", "Kd", "Kc"]], // four kings on the board, ace kicker
  ]) {
    it(`${hole.join(" ")} on ${board.join(" ")}`, () => {
      for (let seed = 1; seed <= 20; seed++) {
        expect(practiceBot(botView(hole, board), facing60, seeded(seed), []).type).not.toBe("fold");
      }
    });
  }
});
