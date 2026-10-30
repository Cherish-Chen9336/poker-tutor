import { describe, expect, it } from "vitest";
import { DECK, dealShowdown, EMPTY_TALLY, interval95, isPremium, PREMIUM_CHANCE, runBlocks, type Showdown } from "./simulate";

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

describe("gambler's fallacy simulation", () => {
  it("counts exactly 34 premium starting hands out of 1,326", () => {
    let premium = 0;
    let all = 0;
    for (let i = 0; i < 52; i++) {
      for (let j = i + 1; j < 52; j++) {
        all++;
        if (isPremium([DECK[i], DECK[j]])) premium++;
      }
    }
    expect([premium, all]).toEqual([34, 1326]);
    expect(PREMIUM_CHANCE).toBeCloseTo(0.02564, 5);
    expect(isPremium(["Kd", "As"])).toBe(true);
    expect(isPremium(["Jc", "Jd"])).toBe(false);
    expect(isPremium(["Ah", "Qh"])).toBe(false);
  });

  it("deals 9 different cards each time", () => {
    const random = seeded(1);
    for (let n = 0; n < 1000; n++) {
      const { a, b, board } = dealShowdown(random);
      expect(new Set([...a, ...b, ...board]).size).toBe(9);
    }
  });

  it("counts a block only when the first 3 hands were outright losses", () => {
    const lose: Showdown = { a: ["2c", "7d"], b: ["As", "Ah"], board: ["Kd", "Qs", "9h", "4c", "3s"] };
    const tie: Showdown = { a: ["2c", "3d"], b: ["2h", "3s"], board: ["Ad", "Ac", "Kh", "Kc", "Qs"] };
    const premium: Showdown = { a: ["Ac", "Kd"], b: ["2h", "7s"], board: ["9d", "8c", "5h", "4c", "3s"] };
    const script = (hands: Showdown[]) => {
      let i = 0;
      return () => hands[i++];
    };
    const streak = runBlocks(EMPTY_TALLY, 1, Math.random, script([lose, lose, lose, premium]));
    expect(streak).toEqual({ blocks: 1, hands: 4, premiumAll: 1, afterStreak: 1, premiumAfterStreak: 1 });
    const broken = runBlocks(EMPTY_TALLY, 1, Math.random, script([lose, tie, lose, premium]));
    expect(broken).toMatchObject({ afterStreak: 0, premiumAfterStreak: 0 });
  });

  it("gives about 2.56% premium hands overall, with or without a losing streak", () => {
    const tally = runBlocks(EMPTY_TALLY, 40_000, seeded(2026));
    const [lowAll, highAll] = interval95(tally.premiumAll, tally.hands);
    expect(lowAll).toBeLessThan(PREMIUM_CHANCE);
    expect(highAll).toBeGreaterThan(PREMIUM_CHANCE);
    // Losing 3 in a row happens in roughly 1 block in 9 (each loss is a bit under 50%).
    expect(tally.afterStreak / tally.blocks).toBeGreaterThan(0.08);
    expect(tally.afterStreak / tally.blocks).toBeLessThan(0.14);
    // Wide margins here: the point is the lesson's claim, not a narrow tolerance.
    const [low, high] = interval95(tally.premiumAfterStreak, tally.afterStreak);
    expect(low).toBeLessThan(PREMIUM_CHANCE);
    expect(high).toBeGreaterThan(PREMIUM_CHANCE);
  });

  it("computes 95% intervals", () => {
    const [low, high] = interval95(26, 1000);
    expect(low).toBeCloseTo(0.0178, 3);
    expect(high).toBeCloseTo(0.0379, 3);
    expect(interval95(0, 0)).toEqual([0, 1]);
  });
});
