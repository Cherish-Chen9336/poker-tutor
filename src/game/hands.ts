// Hand strength for lessons and diagrams, in the app's own terms. Cards are
// codes like "As" (ace of spades) and "Th" (ten of hearts).
import { evaluateStrings, rankBoard, rankDescription } from "@pokertools/evaluator";

export type Comparison = "a" | "b" | "tie";

/** Strength of the best 5 cards among 5–7 cards. Lower is stronger. */
export function handScore(cards: string[]): number {
  return evaluateStrings(cards);
}

/** "a" if hole cards `a` make the better hand with `board`, "b" if `b` does, or "tie". */
export function compareHands(a: string[], b: string[], board: string[]): Comparison {
  const scoreA = handScore([...a, ...board]);
  const scoreB = handScore([...b, ...board]);
  return scoreA < scoreB ? "a" : scoreA > scoreB ? "b" : "tie";
}

/** The 5 cards that play, out of 5–7 cards (the first such set if several tie). */
export function bestFive(cards: string[]): string[] {
  let best: string[] = [];
  let bestScore = Infinity;
  const pick = (start: number, chosen: string[]) => {
    if (chosen.length === 5) {
      const score = handScore(chosen);
      if (score < bestScore) [best, bestScore] = [chosen, score];
      return;
    }
    for (let i = start; i <= cards.length - (5 - chosen.length); i++) pick(i + 1, [...chosen, cards[i]]);
  };
  pick(0, []);
  return best;
}

/** The hand's name, e.g. "Two Pair". An ace-high straight flush is a "Royal Flush". */
export function handName(cards: string[]): string {
  const name = rankDescription(rankBoard(cards.join(" ")));
  if (name === "Straight Flush") {
    const ranks = new Set(bestFive(cards).map((card) => card[0]));
    if (["T", "J", "Q", "K", "A"].every((rank) => ranks.has(rank))) return "Royal Flush";
  }
  return name;
}

export interface Odds {
  wins: number;
  ties: number;
  total: number;
  /** Wins plus half the ties, as a fraction. */
  equity: number;
}

/**
 * With one card to come and both hands known: how many of the unseen cards
 * make `a` win or tie against `b`. Counts every card exactly.
 */
export function oneCardOdds(a: string[], b: string[], board: string[]): Odds {
  const seen = new Set([...a, ...b, ...board]);
  let wins = 0;
  let ties = 0;
  let total = 0;
  for (const rank of "23456789TJQKA") {
    for (const suit of "shdc") {
      const card = rank + suit;
      if (seen.has(card)) continue;
      total++;
      const result = compareHands(a, b, [...board, card]);
      if (result === "a") wins++;
      else if (result === "tie") ties++;
    }
  }
  return { wins, ties, total, equity: (wins + ties / 2) / total };
}
