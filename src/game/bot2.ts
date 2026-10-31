// bot-2: the practice bot for the six-player table, from Codex's Step 6 plan
// review. Like bot-1 it decides only from its own view, its legal moves, the
// public moves of this hand, and its own random source. Its ranges are a
// practice heuristic, not a recommended strategy and never coaching advice.
// bot-1 still plays heads-up.
import { aggress, allIn, checkOrFold, postflop as headsUpPostflop } from "./bot";
import { isUnbeatable, readHand } from "./hand-read";
import type { BotPolicy, PublicAction } from "./match";
import { positionOf, postflopRank } from "./positions";
import { callPrice, sizedTo } from "./pot-math";
import type { LegalMoves, Move, TableView } from "./types";

export const BOT2_POLICY_VERSION = "bot-2";

const RANKS = "23456789TJQKA";

/** "AKs", "AKo", or "QQ" for two hole cards. */
export function handKey(hole: string[]): string {
  const [a, b] = [...hole].sort((x, y) => RANKS.indexOf(y[0]) - RANKS.indexOf(x[0]));
  if (a[0] === b[0]) return a[0] + b[0];
  return a[0] + b[0] + (a[1] === b[1] ? "s" : "o");
}

/**
 * Expands range notation into hand keys: "66+" (sixes up to aces), "22-44",
 * "A2s+" (A2s up to AKs), "KTs+" (KTs up to KQs), "K7s-K8s", "AJo+", "T9s".
 */
export function range(notation: string): Set<string> {
  const keys = new Set<string>();
  const r = (c: string) => RANKS.indexOf(c);
  for (const token of notation.split(/\s+/).filter(Boolean)) {
    const pair = token.match(/^([2-9TJQKA])\1(\+)?(?:-([2-9TJQKA])\3)?$/);
    if (pair) {
      const from = r(pair[1]);
      const to = pair[2] ? r("A") : pair[3] ? r(pair[3]) : from;
      for (let i = Math.min(from, to); i <= Math.max(from, to); i++) keys.add(RANKS[i] + RANKS[i]);
      continue;
    }
    const other = token.match(/^([2-9TJQKA])([2-9TJQKA])([so])(\+)?(?:-\1([2-9TJQKA])\3)?$/);
    if (!other) throw new Error(`Bad range token: ${token}`);
    const [, high, low, kind, plus, until] = other;
    const from = r(low);
    const to = plus ? r(high) - 1 : until ? r(until) : from;
    for (let i = Math.min(from, to); i <= Math.max(from, to); i++) keys.add(high + RANKS[i] + kind);
  }
  return keys;
}

const union = (...sets: Set<string>[]) => new Set(sets.flatMap((set) => [...set]));

// Opening ranges by position (six players), each adding to the one before.
const UTG = range("66+ A2s+ KTs+ QTs+ JTs T9s AJo+ KQo");
const HJ = union(UTG, range("55 K9s Q9s J9s 98s ATo KJo"));
const CO = union(HJ, range("22-44 K7s-K8s Q8s J8s T8s 87s 76s A9o QJo"));
const BTN = union(CO, range("K2s-K6s Q6s-Q7s J7s 97s 86s 65s 54s A2o-A8o KTo QTo JTo"));
export const OPENING: Record<string, Set<string>> = { UTG, HJ, CO, BTN, SB: CO };

const ISOLATE = range("88+ ATs+ KQs AQo+"); // the big blind raising limpers
const REBUY_EARLY = range("QQ+ AKs AKo"); // re-raise against an early-seat open
const REBUY_LATE = range("JJ+ AQs+ AQo+"); // re-raise against a late-seat open
const FLAT = range("77-TT AJs-AQs KQs"); // call an open in position
const BB_DEFEND = range("55-66 ATs KJs QJs JTs AQo KQo"); // the big blind's extra calls
const FLAT_BIG = range("99-TT AQs"); // call a bigger open
// Against an open from a late seat (often a steal), defend wider and sometimes re-raise as a bluff.
const FLAT_VS_LATE = range("22-TT ATs-AQs KJs-KQs QJs JTs T9s 98s");
const LIGHT_REBUY = range("A2s-A5s KTs QTs J9s 87s 76s");
const FOUR_BET = range("QQ+ AKs AKo");
const FLAT_THREE_BET = range("JJ AQs");
const SHOVE_EARLY = range("88+ AJs+ AQo+");
const SHOVE_LATE = range("55+ A5s+ ATo+ KQs");
const CALL_SHOVE_ONE = range("TT+ AQs+ AQo+");
const CALL_SHOVE_MANY = range("QQ+ AKs AKo");

/** Order of acting after the flop: the small blind first, the button last. */
function postflopOrder(view: TableView, seat: number): number {
  return postflopRank(view, seat);
}

function preflop(view: TableView, legal: LegalMoves, seat: number, key: string, history: PublicAction[], random: () => number): Move {
  const me = view.seats[seat]!;
  const bb = view.bigBlind;
  const position = positionOf(view, seat);
  const actions = history.filter((a) => a.street === "preflop");
  const raises = actions.filter((a) => a.move.type === "raise" || a.move.type === "bet");
  const lastRaise = raises.at(-1);
  const lastRaiseTo = lastRaise && "to" in lastRaise.move ? lastRaise.move.to : bb;
  const limpers = raises.length === 0 ? actions.filter((a) => a.move.type === "call").length : 0;
  const callersOfLast = lastRaise ? actions.slice(actions.indexOf(lastRaise) + 1).filter((a) => a.move.type === "call").length : 0;
  const callOrCheck: Move = legal.call !== null ? { type: "call" } : { type: "check" };

  // Stacks against the biggest opponent still in the hand.
  const others = view.seats.filter((s) => s && s.seat !== seat && (s.status === "active" || s.status === "all-in"));
  const myTotal = me.stack + me.betThisStreet;
  const effective = Math.min(myTotal, Math.max(0, ...others.map((s) => s!.stack + s!.betThisStreet))) / bb;

  if (effective <= 12) {
    if (raises.length === 0) {
      if (legal.check) return { type: "check" };
      const shoves = position === "UTG" || position === "HJ" ? SHOVE_EARLY : SHOVE_LATE;
      return shoves.has(key) ? allIn(legal) : { type: "fold" };
    }
    const committed = new Set(raises.map((a) => a.seat)).size + callersOfLast;
    return (committed > 1 ? CALL_SHOVE_MANY : CALL_SHOVE_ONE).has(key) ? callOrCheck : { type: "fold" };
  }

  if (raises.length === 0) {
    if (legal.check) {
      // The big blind after limpers (or everyone folding to it).
      return limpers > 0 && ISOLATE.has(key) ? aggress(legal, 3 * bb + limpers * bb, { type: "check" }) : { type: "check" };
    }
    if (OPENING[position]?.has(key)) return aggress(legal, limpers > 0 ? 3 * bb + limpers * bb : Math.round(2.5 * bb), callOrCheck);
    return { type: "fold" };
  }

  const inPosition = postflopOrder(view, seat) > postflopOrder(view, lastRaise!.seat);
  const reRaiseTo = (inPosition ? 3 : 4) * lastRaiseTo + callersOfLast * lastRaiseTo;

  if (raises.length === 1) {
    const raiserPosition = positionOf(view, raises[0].seat);
    const late = raiserPosition === "CO" || raiserPosition === "BTN" || raiserPosition === "SB";
    const reRaise = late ? REBUY_LATE : REBUY_EARLY;
    if (reRaise.has(key)) return aggress(legal, reRaiseTo, callOrCheck);
    // Defense shrinks gradually as the raise grows (no sudden cliff a raiser could aim just past).
    const size = lastRaiseTo / bb;
    // Against a late open with nobody else in yet, sometimes re-raise as a bluff (at random, so it can't be read).
    if (late && size <= 6 && callersOfLast === 0 && LIGHT_REBUY.has(key) && random() < 0.5) return aggress(legal, reRaiseTo, { type: "fold" });
    if (position === "BB") {
      // The big blind already has chips in, so it defends widest, by the price rather than the raiser's seat.
      const defend = size <= 3 && callersOfLast === 0 ? OPENING.BTN : size <= 6 ? OPENING.CO : union(FLAT, BB_DEFEND);
      return defend.has(key) ? callOrCheck : { type: "fold" };
    }
    if (size > 6) return FLAT_BIG.has(key) && callersOfLast === 0 && inPosition ? callOrCheck : { type: "fold" };
    // With callers already in, drop the smallest pairs.
    const flat = callersOfLast > 0 ? range("99-TT AJs-AQs KQs") : late || size > 3 ? FLAT_VS_LATE : FLAT;
    return inPosition && flat.has(key) ? callOrCheck : { type: "fold" };
  }

  if (raises.length === 2) {
    if (FOUR_BET.has(key)) return aggress(legal, reRaiseTo, callOrCheck);
    const canFlat = inPosition && lastRaiseTo <= 10 * bb && effective >= 40;
    return canFlat && FLAT_THREE_BET.has(key) ? callOrCheck : { type: "fold" };
  }

  // Facing a third raise or more: only the best hands go on, all-in.
  return FOUR_BET.has(key) ? allIn(legal) : { type: "fold" };
}

function multiwayPostflop(view: TableView, legal: LegalMoves, seat: number, hole: string[], random: () => number, history: PublicAction[]): Move {
  const read = readHand(hole, view.board);
  const nuts = isUnbeatable(hole, view.board);
  const strong = read.strength === "strong" || nuts;
  const bigDraw = view.board.length < 5 && (read.flushDraw || read.straightDraw === "open");
  const size = () => sizedTo(view, seat, legal, random() < 0.5 ? 1 / 2 : 2 / 3);

  if (legal.check) {
    const chance = strong ? 0.7 : read.strength === "topPair" ? 0.2 : bigDraw ? 0.15 : 0;
    return random() < chance ? aggress(legal, size(), { type: "check" }) : { type: "check" };
  }

  // Never fold a hand nothing can beat right now.
  if (nuts) return { type: "call" };
  const price = callPrice(view, seat)!;
  const aggressions = history.filter((a) => a.street === view.street && (a.move.type === "bet" || a.move.type === "raise")).length;
  if (strong) return aggressions <= 1 && random() < 0.2 ? aggress(legal, size(), { type: "call" }) : { type: "call" };
  if (aggressions > 1) return { type: "fold" }; // facing a raise, only strong hands go on
  if (read.strength === "topPair" && price.breakEven <= 0.2) return { type: "call" };
  if (bigDraw && price.breakEven <= 0.15) return { type: "call" };
  return checkOrFold(legal);
}

/** bot-2: the six-player bot. With one opponent left after the flop, it plays like bot-1. */
export const tableBot: BotPolicy = (view, legal, random, history) => {
  const seat = view.viewerSeat!;
  const hole = view.seats[seat]!.cards as string[];
  if (view.street === "preflop") return preflop(view, legal, seat, handKey(hole), history, random);
  const opponents = view.seats.filter((s) => s && s.seat !== seat && (s.status === "active" || s.status === "all-in")).length;
  if (opponents <= 1) {
    // One opponent left, and they checked to the bot: bet sometimes with any hand (a "stab"),
    // so a player who checks and gives up can't reach the showdown for free.
    const checkedToMe = history.some((a) => a.street === view.street && a.seat !== seat && a.move.type === "check");
    if (legal.check && checkedToMe && random() < 0.3) {
      const to = sizedTo(view, seat, legal, random() < 0.5 ? 1 / 2 : 2 / 3);
      return aggress(legal, to, { type: "check" });
    }
    return headsUpPostflop(view, legal, seat, hole, random);
  }
  return multiwayPostflop(view, legal, seat, hole, random, history);
};
