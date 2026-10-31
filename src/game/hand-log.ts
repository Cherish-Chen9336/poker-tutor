// Turns a recorded hand into plain sentences ("The bot calls 4.", "Flop: …").
// Card codes appear as tokens like {Ad}, which screens show as cards.
import type { HandRecord, RecordedMove, SeatInfo } from "./match";
import { YOU_SEAT } from "./match";
import { callPrice } from "./pot-math";
import type { Move, TableView } from "./types";

const STREET_NAMES: Record<string, string> = { flop: "Flop", turn: "Turn", river: "River" };

/** "raise to 6", "call 4", "fold"… for any seat, using the view just before the move. */
export function describeMove(move: Move, callAmount: number | null): string {
  switch (move.type) {
    case "fold":
      return "fold";
    case "check":
      return "check";
    case "call":
      return `call ${callAmount ?? ""}`.trim();
    case "bet":
      return `bet ${move.to}`;
    case "raise":
      return `raise to ${move.to}`;
  }
}

/** What a call cost: the same arithmetic as the coach and the engine (a short big blind still makes callers owe the full blind). */
function callAmountFor(view: TableView, seat: number): number {
  return callPrice(view, seat)?.toCall ?? 0;
}

const HEADS_UP_SEATS: SeatInfo[] = [
  { seat: 0, name: "You", learner: true },
  { seat: 1, name: "Bot", learner: false },
];

/** "You", "The bot" (heads-up), or a bot's name. */
function subject(seats: SeatInfo[], seat: number): string {
  const info = seats[seat];
  if (!info || info.learner) return "You";
  return info.name === "Bot" ? "The bot" : info.name;
}

/** "You raise" / "Leo raises". */
function says(seats: SeatInfo[], seat: number, words: string): string {
  if (seats[seat]?.learner) return `You ${words}`;
  return `${subject(seats, seat)} ${words.replace(/^(\w+)/, (verb) => (verb === "raise" ? "raises" : `${verb}s`))}`;
}

function moveLine(seats: SeatInfo[], step: RecordedMove): string {
  const words = describeMove(step.move, step.move.type === "call" ? callAmountFor(step.view, step.actorSeat) : null);
  // All-in means the move used every chip the player had before it (judged before any payout).
  const before = step.view.seats[step.actorSeat];
  const added =
    step.move.type === "call" ? callAmountFor(step.view, step.actorSeat) : "to" in step.move ? step.move.to - (before?.betThisStreet ?? 0) : 0;
  const allIn = !!before && added > 0 && added >= before.stack;
  return `${says(seats, step.actorSeat, words)}${allIn ? " (all-in)" : ""}.`;
}

/** "a flush", "two pair", "one pair"… from a hand description like "Flush". */
function handPhrase(description: string): string {
  const lower = description.toLowerCase();
  return /^(flush|straight|full house|straight flush|royal flush)/.test(lower) ? `a ${lower}` : lower;
}

function newCardsLine(before: TableView, after: TableView): string | null {
  if (after.board.length <= before.board.length) return null;
  const cards = after.board.slice(before.board.length).map((c) => `{${c}}`).join(" ");
  if (after.board.length === 5 && after.board.length - before.board.length > 1) return `The board runs out: ${cards}.`;
  return `${STREET_NAMES[after.street] ?? "Board"}: ${cards}.`;
}

/**
 * The outcome, e.g. "You win 56 chips with one pair. You're 28 chips up." With
 * side pots, each pot is reported on its own; only several winners of one pot
 * is a split pot.
 */
export function resultLine(final: TableView, net: number, seats: SeatInfo[] = HEADS_UP_SEATS): string {
  const outcome = net > 0 ? `You're ${net} chips up.` : net < 0 ? `You're ${-net} chips down.` : "You're even.";
  const how = (seat: number) => {
    const description = final.winners?.find((w) => w.seat === seat)?.description;
    return description ? ` with ${handPhrase(description)}` : "";
  };
  const potLine = (pot: { amount: number; winners: { seat: number; amount: number }[] }, label: string) =>
    pot.winners.length > 1
      ? `${label}split ${pot.winners.map((w) => `${subject(seats, w.seat)} ${w.amount}`).join(", ")} (a tie)`
      : `${label}${says(seats, pot.winners[0].seat, `win ${pot.amount}`)}${how(pot.winners[0].seat)}`;
  const pots = final.potResults;
  const soleWinner = pots && pots.length > 1 && pots.every((pot) => pot.winners.length === 1 && pot.winners[0].seat === pots[0].winners[0].seat);
  if (pots && soleWinner) {
    const seat = pots[0].winners[0].seat;
    const total = pots.reduce((sum, pot) => sum + pot.amount, 0);
    return `${says(seats, seat, `win all ${pots.length} pots (${total} chips)`)}${how(seat)}. ${outcome}`;
  }
  if (pots && pots.length > 1) {
    const parts = pots.map((pot, i) => potLine(pot, i === 0 ? "Main pot: " : `Side pot ${pots.length > 2 ? i : ""}: `.replace(" :", ":")));
    return `${parts.join(". ")}. ${outcome}`;
  }
  const winners = final.winners ?? [];
  if (pots?.length === 1) {
    const pot = pots[0];
    if (pot.winners.length > 1) return `Split pot: ${pot.winners.map((w) => `${subject(seats, w.seat)} ${w.amount}`).join(", ")}. ${outcome}`;
    return `${says(seats, pot.winners[0].seat, `win ${pot.amount} chips`)}${how(pot.winners[0].seat)}. ${outcome}`;
  }
  // Hands saved before Step 6 have no per-pot results (heads-up: one pot).
  if (winners.length > 1) return `Split pot: ${winners.map((w) => w.amount).join(" and ")}. ${outcome}`;
  return `${says(seats, winners[0]?.seat ?? 0, `win ${winners[0]?.amount ?? 0} chips`)}${how(winners[0]?.seat ?? -1)}. ${outcome}`;
}

/** The sentence for one recorded move, e.g. "Leo raises to 6." */
export function moveSentence(record: HandRecord, index: number): string {
  return moveLine(record.seats, record.moves[index]);
}

/** Every line for a hand so far, oldest first. */
export function handLog(record: HandRecord): string[] {
  const seats = record.seats;
  const n = seats.length;
  const first = record.moves[0]?.view ?? record.final;
  const lines: string[] = [];
  for (const seat of record.toppedUp) lines.push(`${subject(seats, seat)} ran out of chips and is topped up to ${record.startStacks[seat]}.`);
  if (first) {
    // Heads-up, the button posts the small blind; otherwise the next two seats post the blinds.
    // A player with fewer chips posts what they have, all-in.
    const button = first.buttonSeat ?? YOU_SEAT;
    const small = n === 2 ? button : (button + 1) % n;
    const big = first.bigBlindSeat ?? (small + 1) % n;
    const posted = (seat: number, blind: number) => {
      const amount = Math.min(blind, record.startStacks[seat]);
      return amount < blind ? `${amount}, all-in` : `${amount}`;
    };
    lines.push(
      `${says(seats, small, "post")} the small blind (${posted(small, first.smallBlind)}). ${says(seats, big, "post")} the big blind (${posted(big, first.bigBlind)}).`,
    );
    const cards = first.seats[record.learnerSeat]!.cards;
    if (cards?.every(Boolean)) lines.push(`Your cards: {${cards[0]}} {${cards[1]}}.`);
  }
  for (const step of record.moves) {
    lines.push(moveLine(seats, step));
    const dealt = newCardsLine(step.view, step.after);
    if (dealt) lines.push(dealt);
  }
  if (record.final && record.net !== null) {
    // A hand can also end with no moves at all (the blinds put someone all-in).
    const before = record.moves.at(-1)?.after ?? first;
    if (!record.moves.length && before && record.final.board.length) {
      lines.push(`The board runs out: ${record.final.board.map((c) => `{${c}}`).join(" ")}.`);
    }
    for (const info of seats) {
      if (info.learner) continue;
      const cards = record.final.seats[info.seat]?.cards;
      if (cards?.every(Boolean)) lines.push(`${says(seats, info.seat, "show")} {${cards[0]}} {${cards[1]}}.`);
    }
    lines.push(resultLine(record.final, record.net, seats));
  }
  return lines;
}
