// Win odds for the coach (Step 6): the learner's estimated share of a pot at
// showdown against opponents holding RANDOM hands. It ignores how they bet
// and assumes nobody else folds; a tie among k players counts as 1/k. Only
// cards the learner can see are removed from the deck: the opponents' hands
// and the rest of the board are sampled together from everything else (cards
// that folded players held are unknown, so they stay in the deck).
import { evaluate, getCardCodes } from "@pokertools/evaluator";

const DECK = [..."23456789TJQKA"].flatMap((r) => [..."shdc"].map((s) => r + s));

export interface Equity {
  /** Average share of the pot, 0–1. */
  share: number;
  /** True when every possible case was counted (then there's no sampling error). */
  exact: boolean;
  /** How many deals were sampled (or counted, when exact). */
  samples: number;
  /** Half-width of the 95% range from sampling (0 when exact). */
  margin: number;
}

/** The share the learner gets in one finished deal: 1 for a win, 1/k for a k-way tie, 0 for a loss. */
function shareOf(mine: number, theirs: number[]): number {
  let best = mine;
  for (const s of theirs) if (s < best) best = s; // lower scores are stronger
  if (best < mine) return 0;
  return 1 / (1 + theirs.filter((s) => s === mine).length);
}

/**
 * Exact share against one random hand on the river (every possible opponent
 * holding) or on the turn (every holding and every river card).
 */
function exactHeadsUp(hole: string[], board: string[]): Equity | null {
  if (board.length < 4) return null;
  const seen = new Set([...hole, ...board]);
  const rest = getCardCodes(DECK.filter((c) => !seen.has(c)));
  const mineCodes = getCardCodes(hole);
  const boardCodes = getCardCodes(board);
  let total = 0;
  let count = 0;
  const rivers = board.length === 5 ? [-1] : rest.map((_, i) => i);
  for (const r of rivers) {
    const fullBoard = r === -1 ? boardCodes : [...boardCodes, rest[r]];
    const mine = evaluate([...mineCodes, ...fullBoard]);
    for (let i = 0; i < rest.length; i++) {
      if (i === r) continue;
      for (let j = i + 1; j < rest.length; j++) {
        if (j === r) continue;
        total += shareOf(mine, [evaluate([rest[i], rest[j], ...fullBoard])]);
        count++;
      }
    }
  }
  return { share: total / count, exact: true, samples: count, margin: 0 };
}

/**
 * Samples `samples` deals: `opponents` random hands plus the rest of the board,
 * drawn together without replacement from the cards the learner can't see.
 */
export function sampleEquity(hole: string[], board: string[], opponents: number, samples: number, random: () => number): Equity {
  const seen = new Set([...hole, ...board]);
  const deck = getCardCodes(DECK.filter((c) => !seen.has(c)));
  const mineCodes = getCardCodes(hole);
  const boardCodes = getCardCodes(board);
  const missing = 5 - board.length;
  const draw = 2 * opponents + missing;
  let sum = 0;
  let sumSquares = 0;
  for (let n = 0; n < samples; n++) {
    // A partial Fisher–Yates shuffle: the first `draw` cards are a fair random sample.
    for (let i = 0; i < draw; i++) {
      const j = i + Math.floor(random() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const fullBoard = [...boardCodes, ...deck.slice(2 * opponents, draw)];
    const mine = evaluate([...mineCodes, ...fullBoard]);
    const theirs: number[] = [];
    for (let o = 0; o < opponents; o++) theirs.push(evaluate([deck[2 * o], deck[2 * o + 1], ...fullBoard]));
    const s = shareOf(mine, theirs);
    sum += s;
    sumSquares += s * s;
  }
  const mean = sum / samples;
  const variance = Math.max(0, sumSquares / samples - mean * mean);
  return { share: mean, exact: false, samples, margin: 1.96 * Math.sqrt(variance / samples) };
}

/** Exact when it's quick (one opponent, turn or river), otherwise sampled. */
export function estimateEquity(hole: string[], board: string[], opponents: number, samples: number, random: () => number): Equity {
  if (opponents === 1) {
    const exact = exactHeadsUp(hole, board);
    if (exact) return exact;
  }
  return sampleEquity(hole, board, opponents, samples, random);
}

export interface EquityRequest {
  /** "the pot", "the main pot", or "side pot 1"… */
  label: string;
  /** Opponents who can win this pot, still in the hand. */
  opponents: number;
}

/**
 * Which estimates the learner needs: one per pot they can win, by how many
 * opponents can win it too. Pots with the same number of opponents share one
 * estimate (against random hands, only the count matters).
 */
export function equityRequests(
  view: { seats: ({ seat: number; status: string; betThisStreet: number } | null)[]; pots: { eligibleSeats: number[] }[] },
  learner: number,
): EquityRequest[] {
  const live = view.seats.filter((s): s is NonNullable<typeof s> => !!s && s.status !== "folded" && s.status !== "out");
  const highest = Math.max(0, ...view.seats.map((s) => s?.betThisStreet ?? 0));
  // Bets on this round (including the learner's call) go to a pot that only players who can
  // match them can win: an all-in player who put in less this round can't win that part.
  const current = live.filter((s) => s.status !== "all-in" || s.betThisStreet >= highest || highest === 0).length - 1;
  const mine = view.pots.filter((pot) => pot.eligibleSeats.includes(learner));
  const requests: EquityRequest[] = [];
  const add = (label: string, opponents: number) => {
    if (opponents > 0 && !requests.some((r) => r.opponents === opponents)) requests.push({ label, opponents });
  };
  mine.forEach((pot, i) => add(i === 0 ? "the main pot" : `side pot ${i}`, pot.eligibleSeats.length - 1));
  if (highest > 0 || mine.length === 0) add(mine.length === 0 ? "the pot" : "this round's bets", current);
  if (requests.length === 1) requests[0] = { ...requests[0], label: "the pot" };
  return requests;
}
