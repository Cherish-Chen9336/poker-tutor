import { describe, expect, it } from "vitest";
import { callPrice, potTotal, sizedTo } from "./pot-math";
import type { LegalMoves, TableView } from "./types";

/** A heads-up view from seat 0's side with the given pot, bets, and stacks. */
function view(pot: number, bets: [number, number], stacks: [number, number]): TableView {
  return {
    viewerSeat: 0,
    handNumber: 1,
    street: "flop",
    board: ["2c", "7d", "9h"],
    pots: pot ? [{ amount: pot, eligibleSeats: [0, 1] }] : [],
    seats: [0, 1].map((seat) => ({ seat, id: `p${seat}`, name: `P${seat}`, stack: stacks[seat], betThisStreet: bets[seat], status: "active", cards: null })),
    buttonSeat: 0,
    bigBlindSeat: 1,
    smallBlind: 1,
    bigBlind: 2,
    actionTo: 0,
    handOver: false,
    winners: null,
  };
}

describe("pot math", () => {
  it("counts bets in front of players as part of the pot", () => {
    expect(potTotal(view(40, [0, 20], [100, 100]))).toBe(60);
  });

  it("gives the break-even chance for a call (lesson 9's example: 20 into 60)", () => {
    expect(callPrice(view(40, [0, 20], [100, 100]), 0)).toEqual({ toCall: 20, potIfCalled: 80, breakEven: 0.25 });
    expect(callPrice(view(40, [20, 20], [100, 100]), 0)).toBeNull();
  });

  it("leaves out opposing chips that a short all-in call can't match", () => {
    // Pot 100, opponent bets 1,000, you have only 100: you can win 300, so you need 33⅓%, not 8⅓%.
    const price = callPrice(view(100, [0, 1000], [100, 0]), 0)!;
    expect(price).toMatchObject({ toCall: 100, potIfCalled: 300 });
    expect(price.breakEven).toBeCloseTo(1 / 3);
  });

  it("sizes bets and raises as a fraction of the pot, within legal limits", () => {
    const betLegal: LegalMoves = { fold: true, check: true, call: null, bet: { min: 2, max: 100 }, raise: null };
    expect(sizedTo(view(60, [0, 0], [100, 100]), 0, betLegal, 0.5)).toBe(30);
    expect(sizedTo(view(60, [0, 0], [100, 100]), 0, betLegal, 2)).toBe(100); // clamped to all-in
    // Facing a bet of 20 into 40: call 20 makes the pot 80; a half-pot raise adds 40, so "raise to 60".
    const raiseLegal: LegalMoves = { fold: true, check: false, call: 20, bet: null, raise: { min: 40, max: 100 } };
    expect(sizedTo(view(40, [0, 20], [100, 80]), 0, raiseLegal, 0.5)).toBe(60);
    expect(sizedTo(view(40, [0, 20], [100, 80]), 0, raiseLegal, 0.1)).toBe(40); // clamped to the minimum raise
    expect(sizedTo(view(40, [0, 20], [100, 80]), 0, { ...raiseLegal, raise: null }, 0.5)).toBeNull();
  });
});
