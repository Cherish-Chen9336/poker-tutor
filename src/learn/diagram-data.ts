// Data drawn by the lesson diagrams. diagram-data.test.ts checks it against
// the evaluator and the engine, so a diagram can't show a wrong fact.

export interface LadderRow {
  name: string;
  cards: string[];
  meaning: string;
  /** How many of all 133,784,560 possible 7-card combinations make this as their best hand. */
  sevenCardCount: number;
}

/** C(52, 7): every possible set of 7 cards (2 private + 5 on the board). */
export const SEVEN_CARD_TOTAL = 133_784_560;

/**
 * Strongest first. The 7-card counts were found by evaluating every possible
 * 7-card combination (2026-10-30); diagram-data.test.ts re-checks them by sampling.
 */
export const RANK_LADDER: LadderRow[] = [
  { name: "Royal Flush", cards: ["As", "Ks", "Qs", "Js", "Ts"], meaning: "The highest straight flush: 10 to ace, all one suit", sevenCardCount: 4_324 },
  { name: "Straight Flush", cards: ["9h", "8h", "7h", "6h", "5h"], meaning: "Five in a row, all one suit", sevenCardCount: 37_260 },
  { name: "Four of a Kind", cards: ["Qc", "Qd", "Qh", "Qs", "7d"], meaning: "Four cards of one rank", sevenCardCount: 224_848 },
  { name: "Full House", cards: ["8s", "8d", "8c", "Kh", "Ks"], meaning: "Three of one rank plus two of another", sevenCardCount: 3_473_184 },
  { name: "Flush", cards: ["Ad", "Jd", "8d", "4d", "2d"], meaning: "Five cards of one suit, in any order", sevenCardCount: 4_047_644 },
  { name: "Straight", cards: ["Tc", "9d", "8s", "7h", "6c"], meaning: "Five ranks in a row, any suits", sevenCardCount: 6_180_020 },
  { name: "Three of a Kind", cards: ["5c", "5d", "5h", "Kd", "9c"], meaning: "Three cards of one rank", sevenCardCount: 6_461_620 },
  { name: "Two Pair", cards: ["Jh", "Jc", "4s", "4d", "Ac"], meaning: "Two different pairs", sevenCardCount: 31_433_400 },
  { name: "One Pair", cards: ["Ts", "Th", "Kc", "7d", "3s"], meaning: "Two cards of one rank", sevenCardCount: 58_627_800 },
  { name: "High Card", cards: ["Ac", "Qd", "9s", "6h", "2c"], meaning: "None of the above; the highest card leads", sevenCardCount: 23_294_460 },
];

export interface SeatLayout {
  players: number;
  /** Seat labels, clockwise from seat 0 (the button). */
  labels: string[];
  /** Seats in the order they act when everyone just calls or checks. */
  preflop: number[];
  postflop: number[];
}

export const SEAT_LAYOUTS: SeatLayout[] = [
  {
    players: 6,
    labels: ["Button", "Small blind", "Big blind", "Under the gun", "Hijack", "Cutoff"],
    preflop: [3, 4, 5, 0, 1, 2],
    postflop: [1, 2, 3, 4, 5, 0],
  },
  {
    players: 2,
    labels: ["Button (small blind)", "Big blind"],
    preflop: [0, 1],
    postflop: [1, 0],
  },
];

/** "2.60%" style: 3 significant digits. */
export function formatPercent(count: number, total: number): string {
  return `${((count / total) * 100).toPrecision(3)}%`;
}

/** "1 in 39" style: whole numbers from 10 up, one decimal below. */
export function formatOneIn(count: number, total: number): string {
  const n = total / count;
  return `1 in ${n >= 10 ? Math.round(n).toLocaleString("en-US") : n.toFixed(1)}`;
}

/** Lesson 9's example: a heart flush draw against a pair of kings, one card to come. */
export const LESSON9_EXAMPLE = { you: ["7h", "6h"], opponent: ["Ks", "Jd"], board: ["Kh", "9h", "2c", "3s"] };
