// Data drawn by the lesson diagrams. diagram-data.test.ts checks it against
// the evaluator and the engine, so a diagram can't show a wrong fact.

export interface LadderRow {
  name: string;
  cards: string[];
  meaning: string;
}

/** Strongest first. */
export const RANK_LADDER: LadderRow[] = [
  { name: "Royal Flush", cards: ["As", "Ks", "Qs", "Js", "Ts"], meaning: "The highest straight flush: 10 to ace, all one suit" },
  { name: "Straight Flush", cards: ["9h", "8h", "7h", "6h", "5h"], meaning: "Five in a row, all one suit" },
  { name: "Four of a Kind", cards: ["Qc", "Qd", "Qh", "Qs", "7d"], meaning: "Four cards of one rank" },
  { name: "Full House", cards: ["8s", "8d", "8c", "Kh", "Ks"], meaning: "Three of one rank plus two of another" },
  { name: "Flush", cards: ["Ad", "Jd", "8d", "4d", "2d"], meaning: "Five cards of one suit, in any order" },
  { name: "Straight", cards: ["Tc", "9d", "8s", "7h", "6c"], meaning: "Five ranks in a row, any suits" },
  { name: "Three of a Kind", cards: ["5c", "5d", "5h", "Kd", "9c"], meaning: "Three cards of one rank" },
  { name: "Two Pair", cards: ["Jh", "Jc", "4s", "4d", "Ac"], meaning: "Two different pairs" },
  { name: "One Pair", cards: ["Ts", "Th", "Kc", "7d", "3s"], meaning: "Two cards of one rank" },
  { name: "High Card", cards: ["Ac", "Qd", "9s", "6h", "2c"], meaning: "None of the above; the highest card leads" },
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
    labels: ["Button", "Small blind", "Big blind", "Seat 4", "Seat 5", "Seat 6"],
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
