// Pot arithmetic shared by the coach, the bot, and the Review screen.
import type { LegalMoves, TableView } from "./types";

/** Everything in the middle: collected pots plus bets in front of players this street. */
export function potTotal(view: TableView): number {
  const pots = view.pots.reduce((sum, pot) => sum + pot.amount, 0);
  return pots + view.seats.reduce((sum, seat) => sum + (seat?.betThisStreet ?? 0), 0);
}

export interface CallPrice {
  /** Chips the player must add to call (capped by their stack). */
  toCall: number;
  /**
   * Everything a call can win, including the player's own call. Opposing chips
   * above what the player can match are excluded: they'd be refunded.
   */
  potIfCalled: number;
  /** The chance of winning a call needs to break even, if the call ends the betting: toCall ÷ potIfCalled. */
  breakEven: number;
}

/** The price of calling for `seat`, or null if there's nothing to call. */
export function callPrice(view: TableView, seat: number): CallPrice | null {
  const me = view.seats[seat];
  if (!me) return null;
  const highest = Math.max(0, ...view.seats.map((s) => s?.betThisStreet ?? 0));
  if (highest <= me.betThisStreet) return null;
  const toCall = Math.min(highest - me.betThisStreet, me.stack);
  const myTotal = me.betThisStreet + toCall;
  const earlierPots = view.pots.filter((pot) => pot.eligibleSeats.includes(seat)).reduce((sum, pot) => sum + pot.amount, 0);
  const others = view.seats.reduce((sum, s) => (s && s.seat !== seat ? sum + Math.min(s.betThisStreet, myTotal) : sum), 0);
  const potIfCalled = earlierPots + others + myTotal;
  return { toCall, potIfCalled, breakEven: toCall / potIfCalled };
}

/**
 * The "to" amount for a bet or raise sized as a fraction of the pot, rounded
 * and clamped to what's legal. A raise means: call first, then raise by that
 * fraction of the pot after the call. Returns null if betting/raising isn't allowed.
 */
export function sizedTo(view: TableView, seat: number, legal: LegalMoves, fraction: number): number | null {
  const range = legal.bet ?? legal.raise;
  if (!range) return null;
  const pot = potTotal(view);
  let to: number;
  if (legal.bet) {
    to = Math.round(fraction * pot);
  } else {
    const me = view.seats[seat]!;
    const highest = Math.max(0, ...view.seats.map((s) => s?.betThisStreet ?? 0));
    const toCall = highest - me.betThisStreet;
    to = highest + Math.round(fraction * (pot + toCall));
  }
  return Math.min(range.max, Math.max(range.min, to));
}
