// Every quick-check answer is verified here, not just written down: hand
// results by the evaluator, game situations by the real engine (Table),
// arithmetic by exact math. "review" questions need a person instead.
import { describe, expect, it } from "vitest";
import { bestFive, compareHands, handName, handScore, oneCardOdds } from "../game/hands";
import { Table } from "../game/table";
import type { Move } from "../game/types";
import lessonsDoc from "../../docs/lessons.md?raw";
import { formatPercent, LESSON9_EXAMPLE, RANK_LADDER, SEVEN_CARD_TOTAL } from "./diagram-data";
import { GUIDED_HANDS } from "./guided-hands";
import { GuidedRun } from "./guided-run";
import { QUIZZES, type Question } from "./quizzes";

const ALL = Object.values(QUIZZES).flat();

function question(id: string): Question {
  const found = ALL.find((q) => q.id === id);
  if (!found) throw new Error(`No question ${id}`);
  return found;
}

/** Asserts that the question's marked answer is the choice at `index`. */
function expectAnswer(id: string, index: number) {
  expect(question(id).answer, id).toBe(index);
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/** A table with seat 0 on the button, dealt and ready for the first move. */
function table(stacks: number[]): Table {
  const t = new Table({
    seats: stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack })),
    smallBlind: 1,
    bigBlind: 2,
    random: seeded(7),
  });
  t.dealHand();
  return t;
}

function play(t: Table, moves: [number, Move][]) {
  for (const [seat, move] of moves) {
    const result = t.move(seat, move);
    expect(result, `seat ${seat} ${JSON.stringify(move)}`).toEqual({ ok: true });
  }
}

const call: Move = { type: "call" };
const check: Move = { type: "check" };
const fold: Move = { type: "fold" };

/** Plays a guided hand to the end. */
function guided(id: number): GuidedRun {
  const run = new GuidedRun(GUIDED_HANDS.find((h) => h.id === id)!);
  while (run.pending) run.tryMove(run.pending.move);
  return run;
}

const LESSON9 = LESSON9_EXAMPLE;
const percent = (x: number, digits = 1) => (x * 100).toFixed(digits);

const checks: Record<string, () => void> = {
  "L1-Q1": () => {
    const t = table([200, 200, 200]);
    // 3 players: the button (seat 0) acts first preflop; seat 1 first after the flop.
    play(t, [[0, call], [1, call], [2, check], [1, { type: "bet", to: 10 }], [2, fold], [0, fold]]);
    const view = t.view(null);
    expect(view.handOver).toBe(true);
    expect(view.board).toHaveLength(3);
    expect(view.winners?.map((w) => w.seat)).toEqual([1]);
    expect(view.seats[1]?.cards).toBeNull();
    expectAnswer("L1-Q1", 1);
  },
  "L1-Q2": () => {
    const t = table([200, 200]);
    play(t, [[0, call], [1, check], [1, check], [0, check]]);
    const view = t.view(null);
    expect(view.street).toBe("turn");
    expect(view.board).toHaveLength(4);
    expectAnswer("L1-Q2", 1);
  },
  "L1-Q3": () => {
    const t = table([200, 200]);
    const streets: string[] = [];
    for (const [seat, move] of [[0, call], [1, check], [1, check], [0, check], [1, check], [0, check], [1, check], [0, check]] as [number, Move][]) {
      const street = t.view(null).street;
      if (streets.at(-1) !== street) streets.push(street);
      play(t, [[seat, move]]);
    }
    expect(streets).toEqual(["preflop", "flop", "turn", "river"]);
    expectAnswer("L1-Q3", 0);
  },

  "L2-Q1": () => {
    expect(handName(["Ah", "3c", "Kh", "9h", "6h", "2h", "Ts"])).toBe("Flush");
    expectAnswer("L2-Q1", 1);
  },
  "L2-Q2": () => {
    const board = ["As", "Ad", "Kc", "Kh", "Qs"];
    expect(compareHands(["Js", "Jd"], ["3c", "2d"], board)).toBe("tie");
    expect(bestFive(["Js", "Jd", ...board]).sort()).toEqual([...board].sort());
    expectAnswer("L2-Q2", 2);
  },
  "L2-Q3": () => {
    const board = ["Ks", "9h", "4c", "2d", "7s"];
    const deck = "23456789TJQKA".split("").flatMap((r) => "shdc".split("").map((s) => r + s)).filter((c) => !board.includes(c));
    let best = Infinity;
    let bestHands: string[][] = [];
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        const score = handScore([deck[i], deck[j], ...board]);
        if (score < best) [best, bestHands] = [score, [[deck[i], deck[j]]]];
        else if (score === best) bestHands.push([deck[i], deck[j]]);
      }
    }
    expect(bestHands.every((hand) => hand.every((card) => card[0] === "K"))).toBe(true);
    expect(handName([...bestHands[0], ...board])).toBe("Three of a Kind");
    expectAnswer("L2-Q3", 1);
  },

  "L3-Q1": () => {
    const board = ["9h", "8s", "7h", "2h", "Qc"];
    expect(handName(["Ah", "3h", ...board])).toBe("Flush");
    expect(handName(["Jd", "Tc", ...board])).toBe("Straight");
    expect(compareHands(["Ah", "3h"], ["Jd", "Tc"], board)).toBe("a");
    expectAnswer("L3-Q1", 0);
  },
  "L3-Q2": () => {
    const board = ["5h", "Kd", "9c", "2s", "3d"];
    expect(handName(["5c", "5d", ...board])).toBe("Three of a Kind");
    expect(handName(["Ks", "9d", ...board])).toBe("Two Pair");
    expect(compareHands(["5c", "5d"], ["Ks", "9d"], board)).toBe("a");
    expectAnswer("L3-Q2", 0);
  },
  "L3-Q3": () => {
    const board = ["3s", "4d", "5h", "Kc", "9s"];
    expect(handName(["Ac", "2d", ...board])).toBe("Straight");
    expect(handName(["6c", "2h", ...board])).toBe("Straight");
    expect(compareHands(["Ac", "2d"], ["6c", "2h"], board)).toBe("b");
    expectAnswer("L3-Q3", 1);
  },
  "L3-Q4": () => {
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], ["Qd", "Jc", "Th", "2s", "3c"])).toBe("tie");
    expectAnswer("L3-Q4", 2);
  },

  "L3-Q5": () => {
    const count = (name: string) => RANK_LADDER.find((row) => row.name === name)!.sevenCardCount;
    expect(count("Two Pair")).toBeGreaterThan(count("High Card"));
    expect(formatPercent(count("Two Pair"), SEVEN_CARD_TOTAL)).toBe("23.5%");
    expect(formatPercent(count("High Card"), SEVEN_CARD_TOTAL)).toBe("17.4%");
    expectAnswer("L3-Q5", 0);
  },

  "L4-Q1": () => {
    const view = table([200, 200]).view(null);
    expect(view.actionTo).toBe(view.buttonSeat);
    expectAnswer("L4-Q1", 0);
  },
  "L4-Q2": () => {
    const t = table([200, 200]);
    play(t, [[0, call], [1, check]]);
    const view = t.view(null);
    expect(view.street).toBe("flop");
    expect(view.actionTo).toBe(view.bigBlindSeat);
    expect(view.actionTo).not.toBe(view.buttonSeat);
    expectAnswer("L4-Q2", 1);
  },
  "L4-Q3": () => {
    const t = table([200, 200, 200, 200]);
    // Seat 1 is the small blind, seat 2 the big blind; seat 3 acts first.
    play(t, [[3, call], [0, call], [1, call]]);
    const moves = t.legalMoves(2);
    expect(moves?.check).toBe(true);
    expect(moves?.call).toBeNull();
    expect(moves?.raise).not.toBeNull();
    expectAnswer("L4-Q3", 1);
  },

  "L5-Q1": () => {
    const t = table([200, 200, 200, 200]);
    play(t, [[3, call], [0, call], [1, call]]);
    expect(t.legalMoves(2)?.check).toBe(true);
    expectAnswer("L5-Q1", 0);
  },
  "L5-Q2": () => {
    const t = table([200, 200, 200]);
    play(t, [[0, { type: "raise", to: 6 }]]);
    expect(t.legalMoves(1)?.raise?.min).toBe(10);
    expect(t.move(1, { type: "raise", to: 8 }).ok).toBe(false);
    expectAnswer("L5-Q2", 1);
  },
  "L5-Q3": () => {
    const t = table([200, 200]);
    play(t, [[0, call], [1, check], [1, { type: "bet", to: 20 }]]);
    const moves = t.legalMoves(0);
    expect(moves?.check).toBe(false);
    expect(moves?.call).toBe(20);
    expect(moves?.raise?.min).toBe(40);
    expectAnswer("L5-Q3", 1);
  },
  "L5-Q4": () => {
    expect(30 - 10).toBe(20);
    expectAnswer("L5-Q4", 1);
  },
  "L5-Q5": () => {
    const t = table([200, 200, 200]);
    // After the flop, seat 1 (A) acts first, then seat 2 (B), then seat 0 (C).
    play(t, [[0, call], [1, call], [2, check], [1, { type: "bet", to: 10 }], [2, call], [0, { type: "raise", to: 30 }]]);
    const forA = t.legalMoves(1);
    expect(forA).toMatchObject({ fold: true, check: false, call: 20 });
    expect(forA?.raise).not.toBeNull();
    play(t, [[1, call]]);
    const forB = t.legalMoves(2);
    expect(forB).toMatchObject({ fold: true, check: false, call: 20 });
    expect(forB?.raise).not.toBeNull();
    expectAnswer("L5-Q5", 1);
  },

  "L6-Q1": () => {
    // You (seat 1) have 32; after the 2-chip blind you have 30 left on the flop.
    const t = table([200, 32]);
    play(t, [[0, call], [1, check], [1, check], [0, { type: "bet", to: 100 }]]);
    const moves = t.legalMoves(1);
    expect(moves).toMatchObject({ fold: true, check: false, call: 30, raise: null });
    expectAnswer("L6-Q1", 1);
  },
  "L6-Q2": () => {
    const t = table([200, 32]);
    play(t, [[0, call], [1, check], [1, check], [0, { type: "bet", to: 100 }], [1, call]]);
    const view = t.view(null);
    // The pot is 2 + 2 before the flop plus 30 + 30 on it: only 30 of the 100 bet.
    expect(view.winners?.reduce((sum, w) => sum + w.amount, 0)).toBe(64);
    expectAnswer("L6-Q2", 1);
  },
  "L6-Q3": () => {
    const t = table([200, 32]);
    play(t, [[0, call], [1, check], [1, check], [0, { type: "bet", to: 100 }], [1, call]]);
    const view = t.view(null);
    expect(view.actionTo).toBeNull();
    expect(view.board).toHaveLength(5);
    expect(view.handOver).toBe(true);
    expectAnswer("L6-Q3", 1);
  },

  "L7-Q1": () => {
    expect(compareHands(["As", "Kd"], ["Ac", "Qh"], ["Ad", "8c", "4s", "9h", "2c"])).toBe("a");
    expectAnswer("L7-Q1", 0);
  },
  "L7-Q2": () => {
    expect(compareHands(["Ac", "3d"], ["Ad", "4h"], ["As", "Kc", "Ks", "Qd", "Jh"])).toBe("tie");
    expectAnswer("L7-Q2", 1);
  },
  "L7-Q3": () => {
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], ["Qd", "Jc", "Th", "2s", "3c"])).toBe("tie");
    expectAnswer("L7-Q3", 1);
  },
  "L8-Q1": () => {
    const run = guided(1);
    const flop = run.log.findIndex((line) => line.startsWith("Flop:"));
    expect(run.log[flop + 1]).toBe("The bot checks.");
    expect(run.view().bigBlindSeat).toBe(1 - run.youSeat);
    expectAnswer("L8-Q1", 1);
  },
  "L8-Q2": () => {
    const run = guided(1);
    expect(run.view().winners?.[0].amount).toBe(56);
    expect(run.table.netResults()[run.youSeat]).toBe(28);
    expectAnswer("L8-Q2", 1);
  },
  "L8-Q3": () => {
    const run = guided(2);
    expect(run.table.netResults()[run.youSeat]).toBe(-2);
    expectAnswer("L8-Q3", 1);
  },
  "L8-Q4": () => {
    const run = guided(3);
    const view = run.view();
    expect(view.board).toHaveLength(3);
    expect(view.seats[1 - run.youSeat]!.status).toBe("folded");
    expect(view.seats[1 - run.youSeat]!.cards).toBeNull();
    expect(view.winners?.[0].bestHand).toBeNull();
    expectAnswer("L8-Q4", 0);
  },

  "L9-Q1": () => {
    expect(20 / (60 + 20)).toBe(0.25);
    expectAnswer("L9-Q1", 1);
  },
  "L9-Q2": () => {
    const odds = oneCardOdds(LESSON9.you, LESSON9.opponent, LESSON9.board);
    expect([odds.wins, odds.ties, odds.total]).toEqual([9, 0, 44]);
    expect(percent(odds.equity)).toBe("20.5");
    expect(percent(50 / 150)).toBe("33.3");
    expect(Math.round(odds.equity * 150 - 50)).toBe(-19);
    expectAnswer("L9-Q2", 1);
  },
  "L9-Q3": () => {
    const odds = oneCardOdds(LESSON9.you, LESSON9.opponent, LESSON9.board);
    expect(percent(25 / 225)).toBe("11.1");
    expect(Math.round(odds.equity * 225 - 25)).toBe(21);
    expect(odds.equity).toBeLessThan(0.5); // "you'll lose most of the time"
    expectAnswer("L9-Q3", 0);
  },
  "L9-Q4": () => {
    expect(8 * 4).toBe(32);
    expect(percent(1 - (39 / 47) * (38 / 46))).toBe("31.5");
    expectAnswer("L9-Q4", 1);
  },
  "L10-Q3": () => {
    // 9 of 47 unseen cards are hearts, versus 13 of 52 with no cards seen.
    expect(9 / 47).toBeLessThan(13 / 52);
    expectAnswer("L10-Q3", 0);
  },
};

describe("quick checks", () => {
  it("have unique ids and valid answers", () => {
    expect(new Set(ALL.map((q) => q.id)).size).toBe(ALL.length);
    for (const q of ALL) {
      expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
      expect(q.answer, q.id).toBeLessThan(q.choices.length);
    }
  });

  it("have a verification for every answer not marked for human review", () => {
    const missing = ALL.filter((q) => q.checkedBy !== "review" && !checks[q.id]).map((q) => q.id);
    expect(missing).toEqual([]);
  });

  for (const [id, verify] of Object.entries(checks)) it(`${id} is correct`, verify);

  it("match the reviewed wording in docs/lessons.md", () => {
    const doc = lessonsDoc;
    const suits: Record<string, string> = { s: "♠", h: "♥", d: "♦", c: "♣" };
    const plain = (text: string) =>
      text
        .replace(/\{(.)(.)\}/g, (_, rank: string, suit: string) => (rank === "T" ? "10" : rank) + suits[suit])
        .replace(/\*\*/g, "")
        .replace(/[“”]/g, '"')
        .replace(/−/g, "−");
    for (const q of ALL) {
      const start = doc.indexOf(`**${q.id}.**`);
      expect(start, `${q.id} is in the doc`).toBeGreaterThan(-1);
      const block = plain(doc.slice(start, doc.indexOf("*Checked by:*", start)));
      expect(block, `${q.id} prompt`).toContain(plain(q.prompt));
      // Every choice, in order; only the correct one is bold and ticked.
      const docChoices = block.split("\n").filter((line) => /^- [A-Z]\. /.test(line));
      const expected = q.choices.map((choice, i) => {
        const letter = String.fromCharCode(65 + i);
        return i === q.answer ? `- ${letter}. ${plain(choice)} ✓` : `- ${letter}. ${plain(choice)}`;
      });
      expect(docChoices, `${q.id} choices`).toEqual(expected);
      expect(block, `${q.id} why`).toContain(plain(q.why));
    }
  });
});
