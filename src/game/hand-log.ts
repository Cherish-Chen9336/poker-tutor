// Turns a recorded hand into plain sentences ("The bot calls 4.", "Flop: …").
// Card codes appear as tokens like {Ad}, which screens show as cards.
import type { HandRecord, RecordedMove } from "./match";
import { YOU_SEAT } from "./match";
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

function callAmountFor(view: TableView, seat: number): number {
  const me = view.seats[seat]!;
  const highest = Math.max(0, ...view.seats.map((s) => s?.betThisStreet ?? 0));
  return Math.min(highest - me.betThisStreet, me.stack);
}

function moveLine(step: RecordedMove): string {
  const seat = step.who === "you" ? YOU_SEAT : 1 - YOU_SEAT;
  const words = describeMove(step.move, step.move.type === "call" ? callAmountFor(step.view, seat) : null);
  if (step.who === "you") return `You ${words}.`;
  return `The bot ${words.replace(/^(\w+)/, (verb) => (verb === "raise" ? "raises" : `${verb}s`))}.`;
}

function newCardsLine(before: TableView, after: TableView): string | null {
  if (after.board.length <= before.board.length) return null;
  const cards = after.board.slice(before.board.length).map((c) => `{${c}}`).join(" ");
  if (after.board.length === 5 && after.board.length - before.board.length > 1) return `The board runs out: ${cards}.`;
  return `${STREET_NAMES[after.street] ?? "Board"}: ${cards}.`;
}

/** The outcome for the learner, e.g. "You win 56 chips. You're 28 chips up." */
export function resultLine(final: TableView, net: number): string {
  const winners = final.winners ?? [];
  const outcome = net > 0 ? `You're ${net} chips up.` : net < 0 ? `You're ${-net} chips down.` : "You're even.";
  if (winners.length > 1) return `Split pot: ${winners.map((w) => w.amount).join(" and ")}. ${outcome}`;
  const who = winners[0]?.seat === YOU_SEAT ? "You win" : "The bot wins";
  const how = winners[0]?.description ? ` with ${winners[0].description.toLowerCase()}` : "";
  return `${who} ${winners[0]?.amount ?? 0} chips${how}. ${outcome}`;
}

/** Every line for a hand so far, oldest first. */
export function handLog(record: HandRecord): string[] {
  const first = record.moves[0]?.view ?? record.final;
  const lines: string[] = [];
  if (first) {
    const youHaveButton = first.buttonSeat === YOU_SEAT;
    lines.push(youHaveButton ? "You post the small blind (1). The bot posts the big blind (2)." : "The bot posts the small blind (1). You post the big blind (2).");
    const cards = first.seats[YOU_SEAT]!.cards;
    if (cards?.every(Boolean)) lines.push(`Your cards: {${cards[0]}} {${cards[1]}}.`);
  }
  for (const step of record.moves) {
    lines.push(moveLine(step));
    const dealt = newCardsLine(step.view, step.after);
    if (dealt) lines.push(dealt);
  }
  if (record.final && record.net !== null) {
    // A hand can also end with no moves at all (the blinds put someone all-in).
    const before = record.moves.at(-1)?.after ?? first;
    if (!record.moves.length && before && record.final.board.length) {
      lines.push(`The board runs out: ${record.final.board.map((c) => `{${c}}`).join(" ")}.`);
    }
    const bot = record.final.seats[1 - YOU_SEAT];
    if (bot?.cards?.every(Boolean)) lines.push(`The bot shows {${bot.cards[0]}} {${bot.cards[1]}}.`);
    lines.push(resultLine(record.final, record.net));
  }
  return lines;
}
