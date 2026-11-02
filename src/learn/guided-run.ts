// Plays one guided hand through the real engine (Table). The bot's moves are
// applied automatically; the learner's moves must match the script.
import { createIntl } from "react-intl";
import type { LogFact, Who } from "../game/log-facts";
import { Table } from "../game/table";
import type { Move, TableView } from "../game/types";
import { wordLog } from "../i18n/log-text";
import { en } from "../i18n/messages/en";
import { BOT, YOU, type GuidedHand, type ScriptStep } from "./guided-hands";

/** Why a move was refused, as facts for any language, plus the English sentence. */
export type MoveCheck =
  | { ok: true }
  | { ok: false; reason: string; why: { kind: "notYourTurn" } | { kind: "wrongMove"; move: Move; call: number | null } };

const english = createIntl({ locale: "en", messages: en });
const YOU_WHO: Who = { kind: "you" };
const BOT_WHO: Who = { kind: "bot" };

function sameMove(a: Move, b: Move): boolean {
  return a.type === b.type && ("to" in a ? a.to : null) === ("to" in b ? b.to : null);
}

/** "raise to 6", "call 4", "fold"… */
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

export class GuidedRun {
  readonly table: Table;
  /** What happened so far, oldest first, as facts each language words (src/i18n/log-text.ts). */
  readonly facts: LogFact[] = [];
  readonly hand: GuidedHand;
  private index = 0;

  constructor(hand: GuidedHand, random?: () => number) {
    this.hand = hand;
    const name = (seat: number) => (seat === hand.youSeat ? "You" : "Bot");
    this.table = new Table({
      seats: [0, 1].map((seat) => ({ id: seat === hand.youSeat ? YOU : BOT, name: name(seat), stack: 200 })),
      smallBlind: 1,
      bigBlind: 2,
      random,
    });
    this.table.dealHand({ hands: hand.hands, board: hand.board });
    const you = hand.youSeat;
    const [small, big] = you === 0 ? [YOU_WHO, BOT_WHO] : [BOT_WHO, YOU_WHO];
    this.facts.push({ kind: "blinds", small, smallAmount: 1, smallAllIn: false, big, bigAmount: 2, bigAllIn: false });
    this.facts.push({ kind: "yourCards", cards: hand.hands[you], botHidden: true });
    this.playBotMoves();
  }

  /** The log in English (for tests and reference). Card tokens like {Ad} show as cards. */
  get log(): string[] {
    return this.facts.map((fact) => wordLog(english, fact));
  }

  get youSeat(): number {
    return this.hand.youSeat;
  }

  /** The learner's next scripted step, or null when it's over. */
  get pending(): ScriptStep | null {
    const step = this.hand.script[this.index];
    return step && step.who === YOU ? step : null;
  }

  /** The script index of the learner's pending step (for its coach line in any language). */
  get stepIndex(): number {
    return this.index;
  }

  get over(): boolean {
    return this.index >= this.hand.script.length;
  }

  view(): TableView {
    return this.table.view(this.hand.youSeat);
  }

  /** Applies the learner's move if it's the one this walkthrough asks for. */
  tryMove(move: Move): MoveCheck {
    const step = this.pending;
    if (!step) return { ok: false, reason: "It isn't your turn.", why: { kind: "notYourTurn" } };
    if (!sameMove(step.move, move)) {
      const call = this.table.legalMoves(this.youSeat)?.call ?? null;
      return {
        ok: false,
        reason: `That's a legal move, but this walkthrough asks you to ${describeMove(step.move, call)}. You'll make your own choices in Play.`,
        why: { kind: "wrongMove", move: step.move, call },
      };
    }
    this.apply(step);
    this.playBotMoves();
    return { ok: true };
  }

  private playBotMoves() {
    while (!this.over && this.hand.script[this.index].who === BOT) this.apply(this.hand.script[this.index]);
  }

  private apply(step: ScriptStep) {
    const seat = step.who === YOU ? this.youSeat : 1 - this.youSeat;
    const before = this.table.view(null);
    const callAmount = this.table.legalMoves(seat)?.call ?? null;
    const result = this.table.move(seat, step.move);
    if (!result.ok) throw new Error(`Guided hand ${this.hand.id}, step ${this.index + 1}: ${result.reason}`);
    this.index++;
    const amount = step.move.type === "call" ? (callAmount ?? undefined) : "to" in step.move ? step.move.to : undefined;
    this.facts.push({
      kind: "move",
      who: step.who === YOU ? YOU_WHO : BOT_WHO,
      move: step.move.type,
      ...(amount === undefined ? {} : { amount }),
      allIn: false,
    });

    const after = this.table.view(null);
    if (after.board.length > before.board.length) {
      const cards = after.board.slice(before.board.length);
      if (after.handOver && after.board.length === 5 && before.board.length < 3) this.facts.push({ kind: "runOut", cards });
      else this.facts.push({ kind: "deal", street: after.street, cards });
    }
    if (after.handOver) this.facts.push(this.resultFact(after));
  }

  private resultFact(view: TableView): LogFact {
    const winners = view.winners ?? [];
    const net = this.table.netResults()[this.youSeat];
    if (winners.length > 1) return { kind: "result", result: { kind: "splitAmounts", amounts: winners.map((w) => w.amount) }, net };
    const who = winners[0]?.seat === this.youSeat ? YOU_WHO : BOT_WHO;
    return { kind: "result", result: { kind: "win", who, amount: winners[0]?.amount ?? 0 }, net };
  }
}
