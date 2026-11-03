// A hand's story as facts, with no words: who posted, moved, was dealt, showed,
// and won. Each language words them (src/i18n/log-text.ts); a test proves the
// English wording equals hand-log.ts's sentences for many played hands.
import { handDescription } from "./hand-log";
import type { HandRecord, RecordedMove, SeatInfo } from "./match";
import { YOU_SEAT } from "./match";
import { callPrice } from "./pot-math";
import type { TableView } from "./types";

/** Who a sentence is about: the learner, the heads-up bot, or a named player. */
export type Who = { kind: "you" } | { kind: "bot" } | { kind: "player"; name: string };

/** One pot's outcome when a hand has several pots. */
export type PotOutcome =
  | { split: { who: Who; amount: number }[] }
  | { winner: Who; amount: number; hand?: string };

export type ResultFact =
  | { kind: "allPots"; who: Who; pots: number; total: number; hand?: string }
  | { kind: "pots"; pots: PotOutcome[] }
  | { kind: "split"; shares: { who: Who; amount: number }[] }
  | { kind: "splitAmounts"; amounts: number[] }
  | { kind: "win"; who: Who; amount: number; hand?: string };

export type LogFact =
  | { kind: "topUp"; who: Who; amount: number }
  | { kind: "blinds"; small: Who; smallAmount: number; smallAllIn: boolean; big: Who; bigAmount: number; bigAllIn: boolean }
  | { kind: "yourCards"; cards: string[]; botHidden?: boolean }
  | { kind: "move"; who: Who; move: "fold" | "check" | "call" | "bet" | "raise"; amount?: number; allIn: boolean }
  | { kind: "deal"; street: string; cards: string[] }
  | { kind: "runOut"; cards: string[] }
  | { kind: "show"; who: Who; cards: string[] }
  | { kind: "result"; result: ResultFact; net: number };

/** The learner, the heads-up bot ("Bot"), or a named bot. */
export function whoAt(seats: SeatInfo[], seat: number): Who {
  const info = seats[seat];
  if (!info || info.learner) return { kind: "you" };
  return info.name === "Bot" ? { kind: "bot" } : { kind: "player", name: info.name };
}

function callAmountFor(view: TableView, seat: number): number {
  return callPrice(view, seat)?.toCall ?? 0;
}

function moveFact(seats: SeatInfo[], step: RecordedMove): LogFact {
  const call = step.move.type === "call" ? callAmountFor(step.view, step.actorSeat) : null;
  // All-in means the move used every chip the player had before it (judged before any payout).
  const before = step.view.seats[step.actorSeat];
  const added = call ?? ("to" in step.move ? step.move.to - (before?.betThisStreet ?? 0) : 0);
  const allIn = !!before && added > 0 && added >= before.stack;
  const amount = call ?? ("to" in step.move ? step.move.to : undefined);
  return { kind: "move", who: whoAt(seats, step.actorSeat), move: step.move.type, ...(amount === undefined ? {} : { amount }), allIn };
}

function newCardsFact(before: TableView, after: TableView): LogFact | null {
  if (after.board.length <= before.board.length) return null;
  const cards = after.board.slice(before.board.length);
  if (after.board.length === 5 && cards.length > 1) return { kind: "runOut", cards };
  return { kind: "deal", street: after.street, cards };
}

/** The outcome, pot by pot when there are several; only several winners of one pot is a split. */
export function resultFact(final: TableView, seats: SeatInfo[]): ResultFact {
  const hand = (seat: number) => handDescription(final, seat);
  const withHand = (seat: number) => {
    const h = hand(seat);
    return h ? { hand: h } : {};
  };
  const shares = (winners: { seat: number; amount: number }[]) => winners.map((w) => ({ who: whoAt(seats, w.seat), amount: w.amount }));
  const pots = final.potResults;
  const soleWinner = pots && pots.length > 1 && pots.every((pot) => pot.winners.length === 1 && pot.winners[0].seat === pots[0].winners[0].seat);
  if (pots && soleWinner) {
    const seat = pots[0].winners[0].seat;
    return { kind: "allPots", who: whoAt(seats, seat), pots: pots.length, total: pots.reduce((sum, pot) => sum + pot.amount, 0), ...withHand(seat) };
  }
  if (pots && pots.length > 1) {
    return {
      kind: "pots",
      pots: pots.map((pot) =>
        pot.winners.length > 1 ? { split: shares(pot.winners) } : { winner: whoAt(seats, pot.winners[0].seat), amount: pot.amount, ...withHand(pot.winners[0].seat) },
      ),
    };
  }
  const winners = final.winners ?? [];
  if (pots?.length === 1) {
    const pot = pots[0];
    if (pot.winners.length > 1) return { kind: "split", shares: shares(pot.winners) };
    return { kind: "win", who: whoAt(seats, pot.winners[0].seat), amount: pot.amount, ...withHand(pot.winners[0].seat) };
  }
  // Hands saved before Step 6 have no per-pot results (heads-up: one pot).
  if (winners.length > 1) return { kind: "splitAmounts", amounts: winners.map((w) => w.amount) };
  return { kind: "win", who: whoAt(seats, winners[0]?.seat ?? 0), amount: winners[0]?.amount ?? 0, ...withHand(winners[0]?.seat ?? -1) };
}

/** The fact for one recorded move. */
export function moveFactAt(record: HandRecord, index: number): LogFact {
  return moveFact(record.seats, record.moves[index]);
}

/**
 * Every fact for a hand so far, oldest first (the same events as handLog's lines). `live` is the table now: before
 * the first move (heads-up, you often act first) it supplies the blinds and your cards.
 */
export function handFacts(record: HandRecord, live?: TableView): LogFact[] {
  const seats = record.seats;
  const n = seats.length;
  const first = record.moves[0]?.view ?? record.final ?? live;
  const facts: LogFact[] = [];
  for (const seat of record.toppedUp) facts.push({ kind: "topUp", who: whoAt(seats, seat), amount: record.startStacks[seat] });
  if (first) {
    // Heads-up, the button posts the small blind; otherwise the next two seats post the blinds.
    // A player with fewer chips posts what they have, all-in.
    const button = first.buttonSeat ?? YOU_SEAT;
    const small = n === 2 ? button : (button + 1) % n;
    const big = first.bigBlindSeat ?? (small + 1) % n;
    const posted = (seat: number, blind: number) => Math.min(blind, record.startStacks[seat]);
    facts.push({
      kind: "blinds",
      small: whoAt(seats, small),
      smallAmount: posted(small, first.smallBlind),
      smallAllIn: posted(small, first.smallBlind) > 0 && posted(small, first.smallBlind) === record.startStacks[small],
      big: whoAt(seats, big),
      bigAmount: posted(big, first.bigBlind),
      bigAllIn: posted(big, first.bigBlind) > 0 && posted(big, first.bigBlind) === record.startStacks[big],
    });
    const cards = first.seats[record.learnerSeat]!.cards;
    if (cards?.every(Boolean)) facts.push({ kind: "yourCards", cards: cards as string[] });
  }
  for (const step of record.moves) {
    facts.push(moveFact(seats, step));
    const dealt = newCardsFact(step.view, step.after);
    if (dealt) facts.push(dealt);
  }
  if (record.final && record.net !== null) {
    // A hand can also end with no moves at all (the blinds put someone all-in).
    const before = record.moves.at(-1)?.after ?? first;
    if (!record.moves.length && before && record.final.board.length) facts.push({ kind: "runOut", cards: record.final.board });
    for (const info of seats) {
      if (info.learner) continue;
      const cards = record.final.seats[info.seat]?.cards;
      if (cards?.every(Boolean)) facts.push({ kind: "show", who: whoAt(seats, info.seat), cards: cards as string[] });
    }
    facts.push({ kind: "result", result: resultFact(record.final, seats), net: record.net });
  }
  return facts;
}
