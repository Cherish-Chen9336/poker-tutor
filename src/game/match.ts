// A practice session between the learner (seat 0) and 1 or 5 bots: deals
// hands one after another on one Table (the engine moves the button), lets
// each bot act from its own view, tops up bots that run out between hands,
// and records each hand for the Review screen.
import { secureRandom } from "./random";
import { Table } from "./table";
import type { LegalMoves, Move, MoveResult, TableView } from "./types";

export const YOU_SEAT = 0;
/** The bot's seat in heads-up play. */
export const BOT_SEAT = 1;

/** A move everyone at the table saw: who, on which round, and what. */
export interface PublicAction {
  seat: number;
  street: TableView["street"];
  move: Move;
}

/**
 * A bot decides from its own view, its legal moves, and the public moves of
 * this hand so far (which every player saw), plus its own random source.
 */
export type BotPolicy = (view: TableView, legal: LegalMoves, random: () => number, history: PublicAction[]) => Move;

export interface SeatInfo {
  seat: number;
  /** "You" for the learner; "Bot" heads-up; a name at the six-player table. */
  name: string;
  learner: boolean;
}

export interface RecordedMove {
  /** The seat that moved. */
  actorSeat: number;
  move: Move;
  /** What the learner could see just before this move. */
  view: TableView;
  /** What the learner could see just after it (e.g. the next card dealt). */
  after: TableView;
  /** The learner's legal moves at that moment (only for the learner's own moves). */
  legal: LegalMoves | null;
}

/** One finished or ongoing hand, as the Review screen replays it. */
export interface HandRecord {
  version: 2;
  /** A stable id for links from lessons and the Review screen (set when the hand is saved). */
  id?: string;
  /** When the hand ended, as an ISO date (set when the hand is saved). */
  playedAt?: string;
  /** Which bot policy played this hand (e.g. "bot-1"). */
  botVersion: string;
  /** The learner's seat (always 0 so far). */
  learnerSeat: number;
  seats: SeatInfo[];
  matchNumber: number;
  handNumber: number;
  /** Each seat's chips when the hand began (after any top-ups). */
  startStacks: number[];
  /** Seats that were topped up just before this hand. Top-ups are never counted as winnings. */
  toppedUp: number[];
  moves: RecordedMove[];
  /** The learner's view when the hand ended (null while it's still being played). */
  final: TableView | null;
  /** Chips the learner won (+) or lost (−) in this hand. */
  net: number | null;
}

/** Names for the bots at the six-player table, by seat. */
export const SIX_SEAT_NAMES = ["You", "Mia", "Leo", "Sam", "Ava", "Kai"];

export interface MatchOptions {
  /** The bot policy for every bot seat. */
  bot: BotPolicy;
  /** Recorded with each hand, so old hands stay understandable after the bot changes. */
  botVersion?: string;
  /** 2 (heads-up, the default) or 6. */
  players?: 2 | 6;
  /** Random numbers for shuffling. Defaults to Web Crypto. */
  random?: () => number;
  /** A separate random stream for the bots' choices, so they can't affect the deal. Defaults to Web Crypto. */
  botRandom?: () => number;
  startingStack?: number;
}

export class Match {
  private table!: Table;
  private readonly bot: BotPolicy;
  private readonly botVersion: string;
  private readonly random: (() => number) | undefined;
  private readonly botRandomOption: (() => number) | undefined;
  private readonly startingStack: number;
  private botRandom!: () => number;
  readonly seats: SeatInfo[];
  matchNumber = 0;
  handNumber = 0;
  current: HandRecord | null = null;

  constructor(options: MatchOptions) {
    this.bot = options.bot;
    this.botVersion = options.botVersion ?? "unknown";
    this.random = options.random;
    this.botRandomOption = options.botRandom;
    this.startingStack = options.startingStack ?? 200;
    const players = options.players ?? 2;
    this.seats =
      players === 2
        ? [
            { seat: 0, name: "You", learner: true },
            { seat: 1, name: "Bot", learner: false },
          ]
        : SIX_SEAT_NAMES.map((name, seat) => ({ seat, name, learner: seat === YOU_SEAT }));
    this.newMatch();
  }

  get players(): number {
    return this.seats.length;
  }

  /** Learner's view of the table. */
  view(): TableView {
    return this.table.view(YOU_SEAT);
  }

  legalMoves(): LegalMoves | null {
    return this.table.legalMoves(YOU_SEAT);
  }

  get handOver(): boolean {
    return this.table.view(null).handOver;
  }

  /**
   * True when the next hand starts a new session: heads-up, when either player
   * has no chips left; at the six-player table, when the learner has none
   * (bots that run out are topped up instead).
   */
  get matchOver(): boolean {
    if (this.handNumber === 0 || !this.handOver) return false;
    const seats = this.table.view(null).seats;
    if (this.players === 2) return seats.some((s) => !s || s.stack === 0);
    return seats[YOU_SEAT]!.stack === 0;
  }

  /** Deals the next hand (topping up bots, or starting a new session first), then lets the bots act. */
  dealNext(): void {
    if (this.matchOver) this.newMatch();
    const toppedUp: number[] = [];
    if (this.players > 2 && this.handNumber > 0) {
      for (const seat of this.seats) {
        if (!seat.learner && this.table.view(null).seats[seat.seat]!.stack === 0) {
          this.table.reseat(seat.seat, this.startingStack);
          toppedUp.push(seat.seat);
        }
      }
    }
    const stacks = this.table.view(null).seats.map((s) => s?.stack ?? 0);
    this.table.dealHand();
    this.handNumber++;
    this.current = {
      version: 2,
      botVersion: this.botVersion,
      learnerSeat: YOU_SEAT,
      seats: this.seats.map((s) => ({ ...s })),
      matchNumber: this.matchNumber,
      handNumber: this.handNumber,
      startStacks: stacks,
      toppedUp,
      moves: [],
      final: null,
      net: null,
    };
    this.runBots();
    this.finishIfOver();
  }

  /** Applies the learner's move; a rejected move changes nothing. */
  act(move: Move): MoveResult {
    if (!this.current || this.handOver) return { ok: false, reason: "The hand is over." };
    const view = this.view();
    const legal = this.legalMoves();
    const result = this.table.move(YOU_SEAT, move);
    if (!result.ok) return result;
    this.current.moves.push({ actorSeat: YOU_SEAT, move, view, after: this.view(), legal });
    this.runBots();
    this.finishIfOver();
    return result;
  }

  private newMatch() {
    this.matchNumber++;
    this.handNumber = 0;
    this.table = new Table({
      seats: this.seats.map((s) => ({ id: s.learner ? "you" : `bot${s.seat}`, name: s.name, stack: this.startingStack })),
      smallBlind: 1,
      bigBlind: 2,
      random: this.random,
    });
    this.botRandom = this.botRandomOption ?? secureRandom();
  }

  private runBots() {
    for (;;) {
      const seat = this.table.view(null).actionTo;
      if (this.handOver || seat === null || seat === YOU_SEAT) return;
      const legal = this.table.legalMoves(seat)!;
      const history = this.current!.moves.map((m) => ({ seat: m.actorSeat, street: m.view.street, move: m.move }));
      const move = this.bot(this.table.view(seat), legal, this.botRandom, history);
      const view = this.view();
      const result = this.table.move(seat, move);
      if (!result.ok) throw new Error(`A bot chose an illegal move (${JSON.stringify(move)}): ${result.reason}`);
      this.current!.moves.push({ actorSeat: seat, move, view, after: this.view(), legal: null });
    }
  }

  private finishIfOver() {
    if (this.current && this.handOver && this.current.final === null) {
      this.current.final = this.view();
      this.current.net = this.table.netResults()[YOU_SEAT];
    }
  }
}
