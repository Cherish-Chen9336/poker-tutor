// The gambler's fallacy demo (lesson 10): independent, fully reshuffled
// heads-up showdowns with no betting, in blocks of 4. A block "qualifies" when
// player A lost the first 3 outright (a tie breaks the streak); we then look at
// A's starting hand in the 4th. Every hand is a fresh shuffle, so the chance of
// a premium hand there is the same as anywhere: 34/1326.
import { getBrowserRNG } from "@pokertools/engine/browser";
import { compareHands } from "./hands";

export const DECK = "23456789TJQKA".split("").flatMap((rank) => "shdc".split("").map((suit) => rank + suit));

/** The app's random source for simulations: Web Crypto, never the engine's default shuffle. */
export function secureRandom(): () => number {
  return getBrowserRNG();
}

/** A-A, K-K, Q-Q, or A-K (any suits). */
export function isPremium(hole: string[]): boolean {
  const [a, b] = hole.map((card) => card[0]).sort();
  return (a === b && "AKQ".includes(a)) || (a === "A" && b === "K");
}

export const PREMIUM_CHANCE = 34 / 1326;

export interface Showdown {
  a: string[];
  b: string[];
  board: string[];
}

/** Deals 9 cards from a freshly shuffled deck (Fisher–Yates on the first 9 positions). */
export function dealShowdown(random: () => number): Showdown {
  const deck = [...DECK];
  for (let i = 0; i < 9; i++) {
    const j = i + Math.floor(random() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return { a: deck.slice(0, 2), b: deck.slice(2, 4), board: deck.slice(4, 9) };
}

export interface StreakTally {
  blocks: number;
  /** All hands dealt, and how many gave player A a premium hand. */
  hands: number;
  premiumAll: number;
  /** Blocks where A lost the first 3 hands, and how many then had a premium 4th hand. */
  afterStreak: number;
  premiumAfterStreak: number;
}

export const EMPTY_TALLY: StreakTally = { blocks: 0, hands: 0, premiumAll: 0, afterStreak: 0, premiumAfterStreak: 0 };

/** Adds `count` more blocks of 4 hands to a tally. */
export function runBlocks(tally: StreakTally, count: number, random: () => number, deal = dealShowdown): StreakTally {
  const next = { ...tally };
  for (let n = 0; n < count; n++) {
    const hands = [deal(random), deal(random), deal(random), deal(random)];
    next.blocks++;
    next.hands += 4;
    next.premiumAll += hands.filter((h) => isPremium(h.a)).length;
    const lostFirstThree = hands.slice(0, 3).every((h) => compareHands(h.a, h.b, h.board) === "b");
    if (lostFirstThree) {
      next.afterStreak++;
      if (isPremium(hands[3].a)) next.premiumAfterStreak++;
    }
  }
  return next;
}

/** Adds two tallies (used to merge a freshly dealt batch into the running totals). */
export function addTally(a: StreakTally, b: StreakTally): StreakTally {
  return {
    blocks: a.blocks + b.blocks,
    hands: a.hands + b.hands,
    premiumAll: a.premiumAll + b.premiumAll,
    afterStreak: a.afterStreak + b.afterStreak,
    premiumAfterStreak: a.premiumAfterStreak + b.premiumAfterStreak,
  };
}

/** 95% Wilson score interval for a proportion, as [low, high]. */
export function interval95(successes: number, trials: number): [number, number] {
  if (trials === 0) return [0, 1];
  const z = 1.96;
  const p = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const center = (p + (z * z) / (2 * trials)) / denominator;
  const half = (z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials))) / denominator;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}
