// Fixed deals: make the engine's shuffle produce a chosen deck, so lessons
// and tests can deal exact cards through the real engine.
import { getCardCode } from "@pokertools/evaluator";

export const ALL_CARDS: readonly string[] = [..."23456789TJQKA"].flatMap((rank) =>
  [..."shdc"].map((suit) => rank + suit),
);

/** Chosen cards for one hand. `hands` lists each dealt player's 2 cards, in seat order. */
export interface FixedDeal {
  hands: string[][];
  board: string[];
}

/**
 * Orders the top of the deck so the engine deals `deal`: hole cards one at a
 * time around the table, twice, then burn + flop, burn + turn, burn + river.
 * Throws if a card is invalid or used twice.
 */
export function deckTopFor(deal: FixedDeal): string[] {
  const cards = [...deal.hands.flat(), ...deal.board];
  if (deal.hands.some((hand) => hand.length !== 2) || deal.board.length !== 5) {
    throw new Error("A fixed deal needs 2 cards per player and 5 board cards");
  }
  for (const card of cards) {
    if (!ALL_CARDS.includes(card)) throw new Error(`Unknown card "${card}"`);
  }
  if (new Set(cards).size !== cards.length) throw new Error("A fixed deal uses a card twice");

  const [burn1, burn2, burn3] = ALL_CARDS.filter((card) => !cards.includes(card));
  const { hands, board } = deal;
  return [
    ...hands.map((hand) => hand[0]),
    ...hands.map((hand) => hand[1]),
    burn1, board[0], board[1], board[2],
    burn2, board[3],
    burn3, board[4],
  ];
}

/**
 * The 51 random numbers that make the engine's Fisher-Yates shuffle put
 * `topCards` on top of the deck, followed by the rest in the engine's
 * unshuffled order (card code = rank * 4 + suit, i.e. 0..51).
 */
export function shuffleDrawsFor(topCards: string[]): number[] {
  const defaultDeck = Array.from({ length: 52 }, (_, code) => code);
  const top = topCards.map(getCardCode);
  const target = [...top, ...defaultDeck.filter((code) => !top.includes(code))];

  // Replay the shuffle backwards: for each position i from the end, pick the
  // index j that swaps the target card into place.
  const working = [...defaultDeck];
  const draws: number[] = [];
  for (let i = working.length - 1; i > 0; i--) {
    const j = working.indexOf(target[i]);
    draws.push((j + 0.5) / (i + 1));
    [working[i], working[j]] = [working[j], working[i]];
  }
  return draws;
}
