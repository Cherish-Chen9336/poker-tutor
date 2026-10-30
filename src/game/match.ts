// A heads-up match between the learner (seat 0) and a bot (seat 1): deals
// hands one after another on one Table (the engine moves the button), lets the
// bot act from its own view, and records each hand for the Review screen.
import { secureRandom } from "./random";
import { Table } from "./table";
import type { LegalMoves, Move, MoveResult, TableView } from "./types";

export const YOU_SEAT = 0;
export const BOT_SEAT = 1;

/** A bot decides from its own view and legal moves only. */
export type BotPolicy = (view: TableView, legal: LegalMoves, random: () => number) => Move;

export interface RecordedMove {
  who: "you" | "bot";
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
  version: 1;
  /** A stable id for links from lessons and the Review screen (set when the hand is saved). */
  id?: string;
  /** When the hand ended, as an ISO date (set when the hand is saved). */
  playedAt?: string;
  /** Which bot policy played this hand (e.g. "bot-1"). */
  botVersion: string;
  matchNumber: number;
  handNumber: number;
  startStacks: [number, number];
  moves: RecordedMove[];
  /** The learner's view when the hand ended (null while it's still being played). */
  final: TableView | null;
  /** Chips the learner won (+) or lost (−) in this hand. */
  net: number | null;
}

export interface MatchOptions {
  bot: BotPolicy;
  /** Recorded with each hand, so old hands stay understandable after the bot changes. */
  botVersion?: string;
  /** Random numbers for shuffling. Defaults to Web Crypto. */
  random?: () => number;
  /** A separate random stream for the bot's choices, so it can't affect the deal. Defaults to Web Crypto. */
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
  matchNumber = 0;
  handNumber = 0;
  current: HandRecord | null = null;

  constructor(options: MatchOptions) {
    this.bot = options.bot;
    this.botVersion = options.botVersion ?? "unknown";
    this.random = options.random;
    this.botRandomOption = options.botRandom;
    this.startingStack = options.startingStack ?? 200;
    this.newMatch();
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

  /** True when someone has no chips left, so the next hand starts a new match. */
  get matchOver(): boolean {
    const seats = this.table.view(null).seats;
    return this.handNumber > 0 && this.handOver && seats.some((s) => !s || s.stack === 0);
  }

  /** Deals the next hand (starting a new match first if someone busted), then lets the bot act. */
  dealNext(): void {
    if (this.matchOver) this.newMatch();
    const stacks = this.table.view(null).seats.map((s) => s?.stack ?? 0) as [number, number];
    this.table.dealHand();
    this.handNumber++;
    this.current = { version: 1, botVersion: this.botVersion, matchNumber: this.matchNumber, handNumber: this.handNumber, startStacks: stacks, moves: [], final: null, net: null };
    this.runBot();
    this.finishIfOver();
  }

  /** Applies the learner's move; a rejected move changes nothing. */
  act(move: Move): MoveResult {
    if (!this.current || this.handOver) return { ok: false, reason: "The hand is over." };
    const view = this.view();
    const legal = this.legalMoves();
    const result = this.table.move(YOU_SEAT, move);
    if (!result.ok) return result;
    this.current.moves.push({ who: "you", move, view, after: this.view(), legal });
    this.runBot();
    this.finishIfOver();
    return result;
  }

  private newMatch() {
    this.matchNumber++;
    this.handNumber = 0;
    this.table = new Table({
      seats: [
        { id: "you", name: "You", stack: this.startingStack },
        { id: "bot", name: "Bot", stack: this.startingStack },
      ],
      smallBlind: 1,
      bigBlind: 2,
      random: this.random,
    });
    this.botRandom = this.botRandomOption ?? secureRandom();
  }

  private runBot() {
    while (!this.handOver && this.table.view(null).actionTo === BOT_SEAT) {
      const legal = this.table.legalMoves(BOT_SEAT)!;
      const move = this.bot(this.table.view(BOT_SEAT), legal, this.botRandom);
      const view = this.view();
      const result = this.table.move(BOT_SEAT, move);
      if (!result.ok) throw new Error(`The bot chose an illegal move (${JSON.stringify(move)}): ${result.reason}`);
      this.current!.moves.push({ who: "bot", move, view, after: this.view(), legal: null });
    }
  }

  private finishIfOver() {
    if (this.current && this.handOver && this.current.final === null) {
      this.current.final = this.view();
      this.current.net = this.table.netResults()[YOU_SEAT];
    }
  }
}
