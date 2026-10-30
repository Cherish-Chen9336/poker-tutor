// The adapter: the only app code that talks to the poker engine library.
// It answers "what may this player do?", applies moves, hides cards each
// viewer shouldn't see, and reports results, all in the app's own types.
import { getBrowserRNG, PokerEngine } from "@pokertools/engine/browser";
import { ActionType, PlayerStatus, Street as EngineStreet, type Action } from "@pokertools/types";
import { deckTopFor, shuffleDrawsFor, type FixedDeal } from "./fixed-deal";
import type {
  LegalMoves,
  Move,
  MoveResult,
  PlayerSetup,
  SeatStatus,
  Street,
  TableView,
} from "./types";

export interface TableOptions {
  /** One entry per seat; null leaves the seat empty. */
  seats: (PlayerSetup | null)[];
  smallBlind: number;
  bigBlind: number;
  /** Random numbers in [0, 1) for shuffling. Defaults to Web Crypto; tests pass a seeded source. */
  random?: () => number;
}

const STREETS: Record<EngineStreet, Street> = {
  [EngineStreet.PREFLOP]: "preflop",
  [EngineStreet.FLOP]: "flop",
  [EngineStreet.TURN]: "turn",
  [EngineStreet.RIVER]: "river",
  [EngineStreet.SHOWDOWN]: "showdown",
};

function seatStatus(status: PlayerStatus): SeatStatus {
  if (status === PlayerStatus.ACTIVE) return "active";
  if (status === PlayerStatus.FOLDED) return "folded";
  if (status === PlayerStatus.ALL_IN) return "all-in";
  return "out";
}

export class Table {
  private readonly engine: PokerEngine;
  /** Shuffle numbers queued for a fixed deal; used before the secure random source. */
  private queuedDraws: number[] = [];
  private stacksAtHandStart: number[] = [];

  constructor(options: TableOptions) {
    const random = options.random ?? getBrowserRNG();
    this.engine = new PokerEngine({
      smallBlind: options.smallBlind,
      bigBlind: options.bigBlind,
      maxPlayers: options.seats.length,
      randomProvider: () => this.queuedDraws.shift() ?? random(),
    });
    options.seats.forEach((player, seat) => {
      if (player) this.engine.sit(seat, player.id, player.name, player.stack);
    });
  }

  /**
   * Starts the next hand. With `deal`, the listed cards are dealt: `deal.hands`
   * gives 2 cards for each player with chips, in seat order.
   */
  dealHand(deal?: FixedDeal): void {
    const stacks = this.engine.state.players.map((p) => p?.stack ?? 0);
    const funded = stacks.filter((stack) => stack > 0).length;
    // The engine treats empty seats as "dead" blind positions and can make the
    // same player post the big blind twice in a row. Going down to heads-up is
    // handled correctly, so only 3+ players with a gap are refused.
    if (funded >= 3 && funded < stacks.length) {
      throw new Error("Tables with 3 or more players can't have empty seats yet");
    }
    if (deal) {
      if (deal.hands.length !== funded) {
        throw new Error(`A fixed deal needs hands for ${funded} players, got ${deal.hands.length}`);
      }
      this.queuedDraws = shuffleDrawsFor(deckTopFor(deal));
    }
    try {
      this.engine.deal();
    } finally {
      this.queuedDraws = [];
    }
    // Saved only after a successful deal. (If the blinds put everyone all-in,
    // the hand is already over at this point.)
    this.stacksAtHandStart = stacks;
  }

  /** What the player in `seat` may do, or null if it isn't their turn. */
  legalMoves(seat: number): LegalMoves | null {
    const state = this.engine.state;
    const player = state.players[seat];
    if (state.actionTo !== seat || !player) return null;

    const myBet = state.currentBets.get(seat) ?? 0;
    // Before the flop the big blind counts as a bet even when it was posted short.
    const betsThisStreet = Math.max(0, ...state.currentBets.values());
    const currentBet = state.street === EngineStreet.PREFLOP ? Math.max(betsThisStreet, state.bigBlind) : betsThisStreet;
    const toCall = currentBet - myBet;
    const allInTo = myBet + player.stack;

    const moves: LegalMoves = {
      fold: true,
      check: toCall === 0,
      call: toCall > 0 ? Math.min(toCall, player.stack) : null,
      bet: null,
      raise: null,
    };
    // Betting or raising needs an opponent who still has chips to respond.
    const canBeCalled = state.players.some(
      (p) => p && p.seat !== seat && p.status === PlayerStatus.ACTIVE && p.stack > 0,
    );
    if (canBeCalled && currentBet === 0) {
      moves.bet = { min: Math.min(state.bigBlind, player.stack), max: player.stack };
    } else if (canBeCalled && allInTo > currentBet) {
      const min = Math.min(state.minRaise, allInTo);
      // The engine decides whether the betting is still open to this player
      // (a short all-in doesn't reopen it).
      if (this.engine.validate(this.toAction(seat, { type: "raise", to: min })).valid) {
        moves.raise = { min, max: allInTo };
      }
    }
    return moves;
  }

  /** Applies a move for the player in `seat`. A rejected move changes nothing. */
  move(seat: number, move: Move): MoveResult {
    const legal = this.legalMoves(seat);
    if (!legal) return { ok: false, reason: "It isn't this player's turn." };

    const rejection = this.checkMove(legal, move);
    if (rejection) return { ok: false, reason: rejection };

    try {
      this.engine.act(this.toAction(seat, move));
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  /** What `viewerSeat` may see (null = a spectator who sees no hidden cards). */
  view(viewerSeat: number | null): TableView {
    const viewerId = viewerSeat === null ? undefined : this.engine.state.players[viewerSeat]?.id;
    const state = this.engine.view(viewerId);
    // App rule (lesson 7): every hand still in at a showdown is shown, so the
    // learner can compare. The engine itself shows only the winners' cards.
    const raw = this.engine.state;
    const stillIn = raw.players.filter((p) => p && p.status !== PlayerStatus.FOLDED && p.hand).length;
    const showdown = raw.winners !== null && stillIn >= 2;
    const shownCards = (seat: number, visible: readonly (string | null)[] | null) => {
      const player = raw.players[seat];
      if (showdown && player?.hand && player.status !== PlayerStatus.FOLDED) return [...player.hand];
      return visible ? [...visible] : null;
    };
    return {
      viewerSeat,
      handNumber: state.handNumber,
      street: STREETS[state.street],
      board: [...state.board],
      pots: state.pots.map((pot) => ({
        amount: pot.amount,
        // The engine updates eligibility only between streets, so drop anyone who folded since.
        eligibleSeats: pot.eligibleSeats
          .filter((seat) => state.players[seat]?.status !== PlayerStatus.FOLDED)
          .sort((a, b) => a - b),
      })),
      seats: state.players.map((p) =>
        p
          ? {
              seat: p.seat,
              id: p.id,
              name: p.name,
              stack: p.stack,
              betThisStreet: state.currentBets.get(p.seat) ?? 0,
              status: seatStatus(p.status),
              cards: shownCards(p.seat, p.hand),
            }
          : null,
      ),
      buttonSeat: state.buttonSeat,
      bigBlindSeat: state.bigBlindSeat,
      smallBlind: state.smallBlind,
      bigBlind: state.bigBlind,
      actionTo: state.actionTo,
      handOver: state.winners !== null,
      winners:
        state.winners?.map((w) => ({
          seat: w.seat,
          amount: w.amount,
          bestHand: w.hand ? [...w.hand] : null,
          description: w.handRank,
        })) ?? null,
    };
  }

  /** Chips each seat won (+) or lost (-) in the last hand. Only meaningful once the hand is over. */
  netResults(): number[] {
    return this.stacksAtHandStart.map((start, seat) => (this.engine.state.players[seat]?.stack ?? 0) - start);
  }

  /** Returns a reason the move is outside the legal moves, or null if it's allowed. */
  private checkMove(legal: LegalMoves, move: Move): string | null {
    switch (move.type) {
      case "fold":
        return null;
      case "check":
        return legal.check ? null : "You can't check when facing a bet. Call, raise, or fold.";
      case "call":
        return legal.call !== null ? null : "There's no bet to call. Check or bet instead.";
      case "bet":
      case "raise": {
        const range = legal[move.type];
        if (!range) {
          return move.type === "bet"
            ? "Someone has already bet, so you can only raise."
            : "You can't raise here.";
        }
        if (!Number.isInteger(move.to)) return "Bets must be a whole number of chips.";
        if (move.to < range.min) return `The smallest ${move.type} here is ${range.min}.`;
        if (move.to > range.max) return `You only have enough chips to ${move.type} to ${range.max}.`;
        return null;
      }
    }
  }

  private toAction(seat: number, move: Move): Action {
    const playerId = this.engine.state.players[seat]!.id;
    switch (move.type) {
      case "fold":
        return { type: ActionType.FOLD, playerId };
      case "check":
        return { type: ActionType.CHECK, playerId };
      case "call":
        return { type: ActionType.CALL, playerId };
      case "bet":
        return { type: ActionType.BET, playerId, amount: move.to };
      case "raise":
        return { type: ActionType.RAISE, playerId, amount: move.to };
    }
  }
}
