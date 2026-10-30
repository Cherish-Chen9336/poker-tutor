import { describe, expect, it } from "vitest";
import { handName, handScore } from "../game/hands";
import { Table } from "../game/table";
import lessonsDoc from "../../docs/lessons.md?raw";
import { formatOneIn, formatPercent, RANK_LADDER, SEAT_LAYOUTS, SEVEN_CARD_TOTAL } from "./diagram-data";

describe("rank ladder", () => {
  it("labels each example with its real hand name", () => {
    for (const row of RANK_LADDER) expect(handName(row.cards), row.name).toBe(row.name);
  });

  it("is ordered strongest first", () => {
    const scores = RANK_LADDER.map((row) => handScore(row.cards));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(new Set(scores).size).toBe(scores.length);
  });
});

const DECK = "23456789TJQKA".split("").flatMap((rank) => "shdc".split("").map((suit) => rank + suit));

/** Mulberry32: a small seeded generator with good statistical quality. */
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

describe("hand frequencies", () => {
  it("cover every 7-card combination exactly once", () => {
    let combinations = 1;
    for (let i = 0; i < 7; i++) combinations = (combinations * (52 - i)) / (i + 1);
    expect(SEVEN_CARD_TOTAL).toBe(combinations);
    expect(RANK_LADDER.reduce((sum, row) => sum + row.sevenCardCount, 0)).toBe(SEVEN_CARD_TOTAL);
  });

  it("match a large random sample of 7-card hands", () => {
    // The exact counts came from evaluating all 133,784,560 combinations once
    // (about 15 seconds); this deterministic sample re-checks them quickly.
    const random = seeded(2026);
    const seen = new Map<string, number>();
    const samples = 200_000;
    for (let n = 0; n < samples; n++) {
      const deck = [...DECK];
      for (let i = 0; i < 7; i++) {
        const j = i + Math.floor(random() * (deck.length - i));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      const name = handName(deck.slice(0, 7));
      seen.set(name, (seen.get(name) ?? 0) + 1);
    }
    for (const row of RANK_LADDER) {
      const p = row.sevenCardCount / SEVEN_CARD_TOTAL;
      const expected = p * samples;
      const allowed = 5 * Math.sqrt(samples * p * (1 - p)) + 3;
      expect(Math.abs((seen.get(row.name) ?? 0) - expected), row.name).toBeLessThan(allowed);
    }
  });

  it("follow the ranking order in 5-card poker, as the lesson says", () => {
    const counts = new Map<string, number>();
    const hand: string[] = [];
    const pick = (start: number) => {
      if (hand.length === 5) {
        const name = handName(hand);
        counts.set(name, (counts.get(name) ?? 0) + 1);
        return;
      }
      for (let i = start; i < DECK.length; i++) {
        hand.push(DECK[i]);
        pick(i + 1);
        hand.pop();
      }
    };
    pick(0);
    const inOrder = RANK_LADDER.map((row) => counts.get(row.name) ?? 0);
    expect(inOrder.reduce((a, b) => a + b, 0)).toBe(2_598_960);
    expect(inOrder).toEqual([...inOrder].sort((a, b) => a - b));
    // With 7 cards, only high card is out of order.
    const seven = RANK_LADDER.slice(0, -1).map((row) => row.sevenCardCount);
    expect(seven).toEqual([...seven].sort((a, b) => a - b));
  });

  it("are shown in docs/lessons.md exactly as the app shows them", () => {
    for (const row of RANK_LADDER) {
      const shown = `${formatPercent(row.sevenCardCount, SEVEN_CARD_TOTAL)} (${formatOneIn(row.sevenCardCount, SEVEN_CARD_TOTAL)})`;
      expect(lessonsDoc, row.name).toContain(shown);
    }
  });
});

describe("seat order", () => {
  for (const layout of SEAT_LAYOUTS) {
    it(`matches the engine with ${layout.players} players`, () => {
      const table = new Table({
        seats: Array.from({ length: layout.players }, (_, i) => ({ id: `p${i}`, name: `P${i}`, stack: 200 })),
        smallBlind: 1,
        bigBlind: 2,
        random: () => 0.5,
      });
      table.dealHand();
      const order = (street: string) => {
        const seats: number[] = [];
        while (table.view(null).street === street) {
          const seat = table.view(null).actionTo!;
          seats.push(seat);
          const moves = table.legalMoves(seat)!;
          expect(table.move(seat, moves.check ? { type: "check" } : { type: "call" }).ok).toBe(true);
        }
        return seats;
      };
      expect(table.view(null).buttonSeat).toBe(0);
      expect(order("preflop")).toEqual(layout.preflop);
      expect(order("flop")).toEqual(layout.postflop);
    });
  }
});
