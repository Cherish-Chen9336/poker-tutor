// Plays one guided hand through the real engine (Table). The bot's moves are
// applied automatically; the learner's moves must match the script.
import { Table } from "../game/table";
import type { Move, TableView } from "../game/types";
import { BOT, YOU, type GuidedHand, type ScriptStep } from "./guided-hands";

export type MoveCheck = { ok: true } | { ok: false; reason: string };

const STREET_NAMES: Record<string, string> = { flop: "Flop", turn: "Turn", river: "River" };

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
  /** What happened so far, oldest first. Card tokens like {Ad} show as cards. */
  readonly log: string[] = [];
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
    this.log.push(
      you === 0 ? "You post the small blind (1). The bot posts the big blind (2)." : "The bot posts the small blind (1). You post the big blind (2).",
    );
    this.log.push(`Your cards: {${hand.hands[you][0]}} {${hand.hands[you][1]}}. The bot's cards are face down.`);
    this.playBotMoves();
  }

  get youSeat(): number {
    return this.hand.youSeat;
  }

  /** The learner's next scripted step, or null when it's over. */
  get pending(): ScriptStep | null {
    const step = this.hand.script[this.index];
    return step && step.who === YOU ? step : null;
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
    if (!step) return { ok: false, reason: "It isn't your turn." };
    if (!sameMove(step.move, move)) {
      const call = this.table.legalMoves(this.youSeat)?.call ?? null;
      return {
        ok: false,
        reason: `That's a legal move, but this walkthrough asks you to ${describeMove(step.move, call)}. You'll make your own choices in Play.`,
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
    const words = describeMove(step.move, callAmount);
    this.log.push(step.who === YOU ? `You ${words}.` : `The bot ${words.replace(/^(\w+)/, "$1s").replace(/^raises to/, "raises to")}.`);

    const after = this.table.view(null);
    if (after.board.length > before.board.length) {
      const newCards = after.board.slice(before.board.length).map((c) => `{${c}}`).join(" ");
      if (after.handOver && after.board.length === 5 && before.board.length < 3) this.log.push(`The board runs out: ${newCards}.`);
      else this.log.push(`${STREET_NAMES[after.street] ?? "Board"}: ${newCards}.`);
    }
    if (after.handOver) this.log.push(this.resultLine(after));
  }

  private resultLine(view: TableView): string {
    const winners = view.winners ?? [];
    const net = this.table.netResults()[this.youSeat];
    const outcome = net > 0 ? `You're ${net} chips up.` : net < 0 ? `You're ${-net} chips down.` : "You're even.";
    if (winners.length > 1) return `Split pot: ${winners.map((w) => w.amount).join(" and ")}. ${outcome}`;
    const who = winners[0]?.seat === this.youSeat ? "You win" : "The bot wins";
    return `${who} ${winners[0]?.amount ?? 0} chips. ${outcome}`;
  }
}
