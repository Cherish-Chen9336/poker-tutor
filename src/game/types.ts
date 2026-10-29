// The app's own game types. Screens, bots, and lessons use only these, never
// the engine library's types, so the library could be replaced later.

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

/**
 * A player's move. `to` is the player's total bet on this street after the
 * move ("raise to 10"), not the amount added on top.
 */
export type Move =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; to: number }
  | { type: "raise"; to: number };

/** What the player to act may do right now. */
export interface LegalMoves {
  fold: boolean;
  check: boolean;
  /** Chips the player must add to call, or null if there's nothing to call. Can be less than the bet if it puts them all-in. */
  call: number | null;
  /** Allowed "bet" sizes when nobody has bet yet this street. `max` is all-in. */
  bet: { min: number; max: number } | null;
  /** Allowed "raise to" totals when facing a bet. `max` is all-in. */
  raise: { min: number; max: number } | null;
}

export type MoveResult = { ok: true } | { ok: false; reason: string };

export type SeatStatus = "active" | "folded" | "all-in" | "out";

export interface SeatView {
  seat: number;
  id: string;
  name: string;
  stack: number;
  /** Chips in front of the player on this street, not yet in a pot. */
  betThisStreet: number;
  status: SeatStatus;
  /** Hole cards the viewer may see. null = no cards; a null card = face down. */
  cards: (string | null)[] | null;
}

export interface PotView {
  amount: number;
  /** Seats that can still win this pot. */
  eligibleSeats: number[];
}

export interface WinnerView {
  seat: number;
  amount: number;
  /** The best five cards, or null when everyone else folded. */
  bestHand: string[] | null;
  /** e.g. "Two Pair, Kings and Nines", or null when everyone else folded. */
  description: string | null;
}

/** Everything one viewer is allowed to see. Opponents' cards stay hidden until shown. */
export interface TableView {
  /** The seat this view is for, or null for a spectator. */
  viewerSeat: number | null;
  handNumber: number;
  street: Street;
  board: string[];
  /** Pots collected from earlier streets. Bets on this street are in `seats[].betThisStreet`. */
  pots: PotView[];
  seats: (SeatView | null)[];
  buttonSeat: number | null;
  bigBlindSeat: number | null;
  smallBlind: number;
  bigBlind: number;
  /** Whose turn it is, or null between hands and while cards are dealt out. */
  actionTo: number | null;
  /** True once the pot has been awarded. */
  handOver: boolean;
  winners: WinnerView[] | null;
}

export interface PlayerSetup {
  id: string;
  name: string;
  stack: number;
}
