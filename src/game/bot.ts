// The practice bot: a simple, documented heads-up policy (from Codex's
// Step 5 plan review). It decides only from its own TableView, its legal
// moves, and an injected random source. It's a practice opponent, not a
// model of good play: its thresholds are bot behavior, never coaching advice.
import { isUnbeatable, readHand } from "./hand-read";
import type { BotPolicy } from "./match";
import { callPrice, sizedTo } from "./pot-math";
import type { LegalMoves, Move, TableView } from "./types";

export const BOT_POLICY_VERSION = "bot-1";

const RANKS = "23456789TJQKA";

/** A starting hand in chart terms: high and low rank values (2–14), suited, pair. */
interface Start {
  high: number;
  low: number;
  suited: boolean;
  pair: boolean;
}

export function startOf(hole: string[]): Start {
  const [a, b] = hole.map((c) => RANKS.indexOf(c[0]) + 2);
  return { high: Math.max(a, b), low: Math.min(a, b), suited: hole[0][1] === hole[1][1], pair: a === b };
}

const A = 14, K = 13, Q = 12, J = 11, T = 10;

/** R: hands the button raises. Any pair, ace, king, or suited hand; Q8o+, J8o+, T8o+, 98o. */
export function inRaiseSet(h: Start): boolean {
  if (h.pair || h.high === A || h.high === K || h.suited) return true;
  if (h.high === Q || h.high === J || h.high === T) return h.low >= 8;
  return h.high === 9 && h.low === 8;
}

/** L: hands the button just calls ("limps"). The other Qxo, J5o+, T6o+, 96o+, 85o+, 76o. */
export function inLimpSet(h: Start): boolean {
  if (inRaiseSet(h)) return false;
  if (h.high === Q) return true;
  if (h.high === J) return h.low >= 5;
  if (h.high === T) return h.low >= 6;
  if (h.high === 9) return h.low >= 6;
  if (h.high === 8) return h.low >= 5;
  return h.high === 7 && h.low === 6;
}

/** V: TT+ and AQ+. */
export function inValueSet(h: Start): boolean {
  return (h.pair && h.high >= T) || (h.high === A && h.low >= Q);
}

/** Premium: QQ+ and AK. */
export function isPremium(h: Start): boolean {
  return (h.pair && h.high >= Q) || (h.high === A && h.low === K);
}

/** Short-stack shoves: pairs, any ace, K8+, QT+, JTs. */
function inShoveSet(h: Start): boolean {
  return h.pair || h.high === A || (h.high === K && h.low >= 8) || (h.high === Q && h.low >= T) || (h.high === J && h.low === T && h.suited);
}

/** Short-stack calls at 7–12 big blinds: 55+, A8+, KQ. */
function inShortCallSet(h: Start): boolean {
  return (h.pair && h.high >= 5) || (h.high === A && h.low >= 8) || (h.high === K && h.low === Q);
}

/** Calls against a raise to more than 3 and up to 10 big blinds: 66+, AT+, KJ+, QJs. */
function inMidCallSet(h: Start): boolean {
  return (h.pair && h.high >= 6) || (h.high === A && h.low >= T) || (h.high === K && h.low >= J) || (h.high === Q && h.low === J && h.suited);
}

export function checkOrFold(legal: LegalMoves): Move {
  return legal.check ? { type: "check" } : { type: "fold" };
}

export function allIn(legal: LegalMoves): Move {
  if (legal.raise) return { type: "raise", to: legal.raise.max };
  if (legal.bet) return { type: "bet", to: legal.bet.max };
  return legal.call !== null ? { type: "call" } : { type: "check" };
}

/** Bet or raise to a total, or fall back when aggression isn't allowed. */
export function aggress(legal: LegalMoves, to: number | null, fallback: Move): Move {
  if (to === null) return fallback;
  if (legal.bet) return { type: "bet", to: Math.min(legal.bet.max, Math.max(legal.bet.min, to)) };
  if (legal.raise) return { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, to)) };
  return fallback;
}

function preflop(view: TableView, legal: LegalMoves, seat: number, h: Start): Move {
  const me = view.seats[seat]!;
  const other = view.seats[1 - seat]!;
  const bb = view.bigBlind;
  const effective = Math.min(me.stack + me.betThisStreet, other.stack + other.betThisStreet) / bb;
  const highest = Math.max(me.betThisStreet, other.betThisStreet);
  const raised = highest > bb; // someone raised above the big blind
  const callOrFold: Move = legal.call !== null ? { type: "call" } : { type: "check" };

  if (effective <= 12) {
    if (!raised) return inShoveSet(h) ? allIn(legal) : checkOrFold(legal);
    const price = callPrice(view, seat);
    const calls = effective <= 6 ? inShoveSet(h) : inShortCallSet(h);
    return calls || (price && price.breakEven <= 0.15) ? callOrFold : { type: "fold" };
  }

  const isButton = view.buttonSeat === seat;
  if (!raised && isButton && legal.call !== null) {
    // First to act on the button, facing only the big blind.
    if (inRaiseSet(h)) return aggress(legal, Math.round(2.5 * bb), { type: "call" });
    return inLimpSet(h) ? { type: "call" } : { type: "fold" };
  }
  if (!raised && legal.check) {
    // Big blind after the button just called.
    return inValueSet(h) ? aggress(legal, 4 * bb, { type: "check" }) : { type: "check" };
  }

  // Facing a raise.
  const raiseInBigBlinds = highest / bb;
  if (raiseInBigBlinds <= 3) {
    if (isPremium(h)) return aggress(legal, 3 * highest, callOrFold);
    return inRaiseSet(h) ? callOrFold : { type: "fold" };
  }
  if (raiseInBigBlinds <= 10) {
    if (isPremium(h)) return aggress(legal, 3 * highest, callOrFold);
    return inMidCallSet(h) ? callOrFold : { type: "fold" };
  }
  if (isPremium(h)) return allIn(legal);
  // Against very big raises (often all-in), calling only the strongest hands would let an
  // always-all-in player win; the bot calls the same hands it calls mid-size raises with.
  return inMidCallSet(h) ? callOrFold : { type: "fold" };
}

/** bot-1's postflop play; bot-2 reuses it when only one opponent is left. */
export function postflop(view: TableView, legal: LegalMoves, seat: number, hole: string[], random: () => number): Move {
  const read = readHand(hole, view.board);
  const river = view.board.length === 5;
  // Never fold a hand nothing can beat right now (on the river, nothing ever can).
  const nuts = read.strength !== "strong" && isUnbeatable(hole, view.board);
  const strong = read.strength === "strong" || nuts;
  const bigDraw = !river && (read.flushDraw || read.straightDraw === "open");
  // Bet sizes don't depend on the hand, so they give nothing away: ½ or ⅔ of the pot.
  const size = () => sizedTo(view, seat, legal, random() < 0.5 ? 1 / 2 : 2 / 3);

  if (legal.check) {
    const chance = strong ? 0.8 : read.strength === "topPair" ? 0.4 : bigDraw ? 0.3 : 0.1;
    return random() < chance ? aggress(legal, size(), { type: "check" }) : { type: "check" };
  }

  const price = callPrice(view, seat)!;
  // Strong hands (including an unbeatable river hand) never fold.
  if (strong) return random() < 0.25 ? aggress(legal, size(), { type: "call" }) : { type: "call" };
  const limit =
    read.strength === "topPair" ? 1 / 3 : read.strength === "lowerPair" ? 1 / 5 : read.strength === "aceHigh" ? 1 / 10 : 0;
  if (price.breakEven <= limit) return { type: "call" };
  if (bigDraw && price.breakEven <= 0.18) return { type: "call" };
  return { type: "fold" };
}

/** The bot. Uses only its own view (its cards, the board, the bets) and its random source. */
export const practiceBot: BotPolicy = (view, legal, random) => {
  const seat = view.viewerSeat!;
  const hole = view.seats[seat]!.cards as string[];
  if (view.street === "preflop") return preflop(view, legal, seat, startOf(hole));
  return postflop(view, legal, seat, hole, random);
};
