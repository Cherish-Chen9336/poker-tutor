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
