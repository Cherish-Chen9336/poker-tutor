// Seat names by position, counted from the button. Heads-up, the button is
// also the small blind. With 3–6 players, seats left of the button are the
// small blind and big blind, then under the gun, hijack, and cutoff (fewer
// players drop the early names first).
import type { TableView } from "./types";

export type Position = "BTN" | "SB" | "BB" | "UTG" | "HJ" | "CO";

export const POSITION_NAMES: Record<Position, string> = {
  BTN: "button",
  SB: "small blind",
  BB: "big blind",
  UTG: "under the gun",
  HJ: "hijack",
  CO: "cutoff",
};

const BY_DISTANCE: Record<number, Position[]> = {
  2: ["BTN", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "CO"],
  5: ["BTN", "SB", "BB", "HJ", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
};

/** The position of `seat` this hand. */
export function positionOf(view: TableView, seat: number): Position {
  const n = view.seats.length;
  return BY_DISTANCE[n][(seat - (view.buttonSeat ?? 0) + n) % n];
}

/** 1 = first to act after the flop (left of the button) … n = the button, last. */
export function postflopRank(view: TableView, seat: number): number {
  const n = view.seats.length;
  return ((seat - (view.buttonSeat ?? 0) - 1 + n) % n) + 1;
}
