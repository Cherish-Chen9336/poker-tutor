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

export const BOT2_POLICY_VERSION = "bot-2.1";

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

// Opening ranges by position (six players), each adding to the one before. Widened one step per seat
// on 2026-10-31 (each seat now opens what the seat after it used to) so the table plays less tightly.
const UTG = range("55+ A2s+ K9s+ Q9s+ J9s+ T9s 98s ATo+ KJo+");
const HJ = union(UTG, range("22-44 K7s-K8s Q8s J8s T8s 87s 76s A9o QJo"));
const CO = union(HJ, range("K5s-K6s Q7s J7s 97s 86s 65s 54s A7o-A8o KTo QTo JTo"));
const BTN = union(CO, range("K2s-K4s Q2s-Q6s J5s-J6s T6s-T7s 96s 75s 64s 53s 43s A2o-A6o K8o-K9o Q8o-Q9o J8o-J9o T8o-T9o 98o 87o"));
export const OPENING: Record<string, Set<string>> = { UTG, HJ, CO, BTN, SB: CO };

const ISOLATE = range("77+ ATs+ KJs+ AJo+ KQo"); // the big blind raising limpers
const REBUY_EARLY = range("QQ+ AKs AKo"); // re-raise against an early-seat open
const REBUY_LATE = range("TT+ AJs+ KQs AQo+"); // re-raise against a late-seat open
// Calls are wide enough that pots with three or more players happen regularly (tuned 2026-10-31
// against table-shape targets; see bot2.test.ts).
const FLAT = range("22-TT A9s-AQs KTs-KQs QTs-QJs JTs T9s 98s 87s AQo KQo"); // call an open in position
const BB_DEFEND = range("55-66 ATs KJs QJs JTs AQo KQo"); // the big blind's extra calls
const FLAT_BIG = range("99-TT AQs"); // call a bigger open
// Against an open from a late seat (often a steal), defend wider and sometimes re-raise as a bluff.
const FLAT_VS_LATE = range("22-TT A2s-AQs K9s-KQs Q9s-QJs J9s-JTs T9s 98s 87s 76s 65s ATo-AQo KJo-KQo");
// Joining a cheap raise that someone already called: hands that do well in pots with several players.
const FLAT_MULTIWAY = range("22-TT A2s-AQs K9s-KQs Q9s-QJs J9s-JTs T9s 98s 87s 76s 65s 54s");
// The small blind acts first after the flop, so it calls a cheap raise with fewer hands.
const SB_FLAT = range("66-TT ATs-AQs KJs-KQs QJs JTs");
const SB_FLAT_VS_LATE = range("22-TT A8s-AQs KTs-KQs QTs-QJs JTs T9s 98s 87s AJo-AQo KQo");
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
      // Against a lone small-blind limp, raise a wider range (the small blind often limps weak hands).
      const sbOnly = limpers === 1 && actions.some((a) => a.move.type === "call" && positionOf(view, a.seat) === "SB");
      const raiseWith = sbOnly ? OPENING.CO : ISOLATE;
      return limpers > 0 && raiseWith.has(key) ? aggress(legal, 3 * bb + limpers * bb, { type: "check" }) : { type: "check" };
    }
    if (OPENING[position]?.has(key)) return aggress(legal, limpers > 0 ? 3 * bb + limpers * bb : Math.round(2.5 * bb), callOrCheck);
    // Just calling ("limping"), as casual tables often do: the small blind completes with more hands
    // when everyone folded to it, and others join a pot that someone already limped into.
    if (position === "SB" && limpers === 0 && OPENING.BTN.has(key)) return callOrCheck;
    if (limpers > 0 && FLAT_MULTIWAY.has(key)) return callOrCheck;
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
      // The big blind already has chips in, so it defends widest, by the price rather than the raiser's seat
      // (callers in front make the price even better).
      const defend = size <= 3 ? OPENING.BTN : size <= 6 ? OPENING.CO : union(FLAT, BB_DEFEND);
      return defend.has(key) ? callOrCheck : { type: "fold" };
    }
    if (size > 6) return FLAT_BIG.has(key) && callersOfLast === 0 && inPosition ? callOrCheck : { type: "fold" };
    if (position === "SB") {
      // With a caller already in, the price is better and the pot will have several players.
      const sbFlat = callersOfLast > 0 ? FLAT_MULTIWAY : late ? SB_FLAT_VS_LATE : SB_FLAT;
      return size <= 3 && sbFlat.has(key) ? callOrCheck : { type: "fold" };
    }
    const flat = callersOfLast > 0 ? (size <= 3 ? FLAT_MULTIWAY : range("99-TT AJs-AQs KQs")) : late || size > 3 ? FLAT_VS_LATE : FLAT;
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
  // Facing a single bet, defend with pairs and good draws, so betting every time it's checked around
  // can't win the pot too often: top pair against bets up to about three-quarters of the pot, a lower
  // pair only against a third of the pot or less (with several players in, someone often has it beaten).
  if (price.breakEven <= 0.3) {
    if (read.strength === "topPair" || (read.strength === "lowerPair" && price.breakEven <= 0.2)) return { type: "call" };
    if (bigDraw || (view.board.length < 5 && read.straightDraw === "gutshot" && price.breakEven <= 0.2)) return { type: "call" };
  }
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
    const firstToAct = !history.some((a) => a.street === view.street);
    // Sometimes bet first with any hand ("leading"), and bet when checked to (a "stab").
    if (legal.check && ((checkedToMe && random() < 0.3) || (firstToAct && random() < 0.2))) {
      const to = sizedTo(view, seat, legal, random() < 0.5 ? 1 / 2 : 2 / 3);
      return aggress(legal, to, { type: "check" });
    }
    // Against one opponent's small bet, defend more than bot-1 would: otherwise a player who
    // bets every flop after raising before it wins too often (Codex's Step 6 verification).
    if (!legal.check) {
      const read = readHand(hole, view.board);
      const strongNow = read.strength === "strong" || isUnbeatable(hole, view.board);
      const price = callPrice(view, seat)!;
      if (!strongNow) {
        const boardMax = Math.max(...view.board.map((c) => "23456789TJQKA".indexOf(c[0])));
        const overcards = hole.every((c) => "23456789TJQKA".indexOf(c[0]) > boardMax);
        const draw = read.flushDraw || read.straightDraw !== null;
        const madeOrAce = read.strength !== "nothing";
        if (view.board.length < 5 && price.breakEven <= 0.3) {
          // Sometimes fight back with a raise (a bluff), so betting every round doesn't win automatically.
          const bluffRaise = draw || overcards ? 0.15 : 0.08;
          if (random() < bluffRaise) {
            const to = sizedTo(view, seat, legal, 2 / 3);
            if (to !== null) return aggress(legal, to, { type: "call" });
          }
          if (madeOrAce || draw || overcards || random() < 0.3) return { type: "call" };
        }
        if (view.board.length === 5 && price.breakEven <= 0.25 && madeOrAce) return { type: "call" };
      }
    }
    return headsUpPostflop(view, legal, seat, hole, random);
  }
  return multiwayPostflop(view, legal, seat, hole, random, history);
};
