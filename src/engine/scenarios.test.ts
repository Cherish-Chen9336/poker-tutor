// Rules scenarios from docs/rules-scenarios.md, one test per scenario number.
// Blinds are 1/2. On the first hand the button is seat 0; with 3+ players the
// small blind is seat 1 and the big blind seat 2. Heads-up, the button (seat 0)
// is the small blind.
import { describe, expect, it } from "vitest";
import { evaluateStrings, rankBoard, rankDescription } from "@pokertools/evaluator";
import { ActionType, Street } from "@pokertools/types";
import { act, checkDown, fixedTable, isLegal, netResults, totalChips } from "./test-helpers";

const { FOLD, CHECK, CALL, BET, RAISE } = ActionType;

// A board with no straight or flush possibilities for the hands used below.
const DRY_BOARD = ["2c", "7d", "9h", "4s", "Jc"];
const ROYAL_BOARD = ["As", "Ks", "Qs", "Js", "Ts"];
const RAGS = [["3d", "5h"], ["6d", "8h"], ["3h", "5d"], ["6h", "8d"]];

/** Each collected pot's size and who can win it, with seats in order. */
function pots(engine: ReturnType<typeof fixedTable>) {
  return engine.state.pots.map((pot) => ({
    amount: pot.amount,
    eligibleSeats: [...pot.eligibleSeats].sort((a, b) => a - b),
  }));
}

describe("turn order and betting", () => {
  it("1. heads-up: the button posts the small blind and acts first only before the flop", () => {
    const engine = fixedTable(RAGS.slice(0, 2), DRY_BOARD, [200, 200]);
    engine.deal();
    expect(engine.state.buttonSeat).toBe(0);
    expect(engine.state.currentBets.get(0)).toBe(1);
    expect(engine.state.currentBets.get(1)).toBe(2);
    expect(engine.state.actionTo).toBe(0);
    act(engine, 0, CALL);
    act(engine, 1, CHECK); // the big blind gets the last word before the flop
    expect(engine.state.street).toBe(Street.FLOP);
    expect(engine.state.actionTo).toBe(1);
    act(engine, 1, CHECK);
    expect(engine.state.actionTo).toBe(0);
  });

  it("1b. three or more players: first to act is left of the big blind, then left of the button", () => {
    const engine = fixedTable(RAGS, DRY_BOARD, [200, 200, 200, 200]);
    engine.deal();
    act(engine, 3, CALL);
    act(engine, 0, CALL);
    act(engine, 1, CALL);
    // Everyone only called, so the big blind may still check or raise (the "option").
    expect(isLegal(engine, 2, CHECK)).toBe(true);
    expect(isLegal(engine, 2, RAISE, 4)).toBe(true);
    act(engine, 2, CHECK);
    expect(engine.state.street).toBe(Street.FLOP);
    act(engine, 1, CHECK);
    act(engine, 2, CHECK);
    act(engine, 3, CHECK);
    act(engine, 0, CHECK);
    expect(engine.state.street).toBe(Street.TURN);
    expect(engine.state.actionTo).toBe(1);
  });

  it("2. a bet nobody calls goes back to the bettor", () => {
    const stacks = [200, 200];
    const engine = fixedTable(RAGS.slice(0, 2), DRY_BOARD, stacks);
    engine.deal();
    act(engine, 0, CALL);
    act(engine, 1, CHECK); // pot is 4
    act(engine, 1, BET, 50);
    act(engine, 0, FOLD);
    expect(engine.state.winners).toEqual([expect.objectContaining({ seat: 1, amount: 4 })]);
    expect(netResults(engine, stacks)).toEqual([-2, 2]);
    expect(totalChips(engine)).toBe(400);
  });

  it("3. a raise must be at least as big as the previous raise", () => {
    const engine = fixedTable(RAGS.slice(0, 3), DRY_BOARD, [200, 200, 200]);
    engine.deal();
    act(engine, 0, RAISE, 6); // raises by 4
    expect(isLegal(engine, 1, CHECK)).toBe(false); // can't check facing a bet
    expect(isLegal(engine, 1, RAISE, 9)).toBe(false);
    expect(isLegal(engine, 1, RAISE, 10)).toBe(true);
    act(engine, 1, CALL);
    act(engine, 2, CALL);
    // Flop: the smallest opening bet is the big blind.
    expect(isLegal(engine, 1, BET, 1)).toBe(false);
    expect(isLegal(engine, 1, BET, 2)).toBe(true);
  });

  it("3b. an all-in may be smaller than the minimum raise", () => {
    // Seat 1 has 8 chips: after posting the small blind, 7 are left.
    const engine = fixedTable(RAGS.slice(0, 3), DRY_BOARD, [200, 8, 200]);
    engine.deal();
    act(engine, 0, RAISE, 6);
    expect(isLegal(engine, 1, RAISE, 8)).toBe(true); // all-in, raises by only 2
    act(engine, 1, RAISE, 8);
    expect(engine.state.players[1]!.stack).toBe(0);
    expect(totalChips(engine)).toBe(408);
  });

  it("4. a short all-in doesn't shrink the minimum raise", () => {
    // Seat 2 reaches the flop with exactly 150 chips.
    const engine = fixedTable(RAGS.slice(0, 3), DRY_BOARD, [500, 500, 152]);
    engine.deal();
    act(engine, 0, CALL);
    act(engine, 1, CALL);
    act(engine, 2, CHECK);
    act(engine, 1, BET, 100); // A
    act(engine, 2, RAISE, 150); // B, all-in: only 50 more
    expect(engine.state.players[2]!.stack).toBe(0);
    // C: the last full raise was 100, so the minimum is 150 + 100.
    expect(isLegal(engine, 0, RAISE, 200)).toBe(false);
    expect(isLegal(engine, 0, RAISE, 249)).toBe(false);
    expect(isLegal(engine, 0, RAISE, 250)).toBe(true);
  });

  it("5. a short all-in doesn't reopen the betting for players who already acted", () => {
    const engine = fixedTable(RAGS.slice(0, 3), DRY_BOARD, [122, 500, 500]);
    engine.deal();
    act(engine, 0, CALL);
    act(engine, 1, CALL);
    act(engine, 2, CHECK);
    act(engine, 1, BET, 100); // A
    act(engine, 2, CALL); // B
    act(engine, 0, RAISE, 120); // C, all-in: only 20 more
    for (const seat of [1, 2]) {
      expect(isLegal(engine, seat, RAISE, 300)).toBe(false);
      expect(isLegal(engine, seat, CALL)).toBe(true);
      expect(isLegal(engine, seat, FOLD)).toBe(true);
      act(engine, seat, CALL);
    }
    expect(engine.state.street).toBe(Street.TURN);
  });

  it("5b. several short all-ins can add up to a full raise, but only for some players", () => {
    const engine = fixedTable([...RAGS, ["3s", "5c"]], DRY_BOARD, [500, 500, 152, 500, 202]);
    engine.deal();
    act(engine, 3, CALL);
    act(engine, 4, CALL);
    act(engine, 0, CALL);
    act(engine, 1, CALL);
    act(engine, 2, CHECK);
    act(engine, 1, BET, 100); // A
    act(engine, 2, RAISE, 150); // B, all-in: 50 more
    act(engine, 3, CALL); // C calls 150
    act(engine, 4, RAISE, 200); // D, all-in: another 50 more
    act(engine, 0, CALL); // E calls 200
    // A faces 100 more than A's own bet: a full raise, so A may raise again (to at least 300).
    expect(isLegal(engine, 1, RAISE, 299)).toBe(false);
    expect(isLegal(engine, 1, RAISE, 300)).toBe(true);
    act(engine, 1, CALL);
    // C faces only 50 more than C's own call: not a full raise, so C may only call or fold.
    expect(isLegal(engine, 3, RAISE, 300)).toBe(false);
    expect(isLegal(engine, 3, CALL)).toBe(true);
  });
});

describe("pots", () => {
  it("6. a player all-in for less can only win the main pot", () => {
    const stacks = [50, 300, 300];
    const engine = fixedTable([["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], DRY_BOARD, stacks);
    engine.deal();
    act(engine, 0, RAISE, 50); // A, all-in
    act(engine, 1, CALL);
    act(engine, 2, CALL);
    act(engine, 1, BET, 100);
    act(engine, 2, CALL);
    expect(engine.state.street).toBe(Street.TURN);
    expect(pots(engine)).toEqual([
      { amount: 150, eligibleSeats: [0, 1, 2] },
      { amount: 200, eligibleSeats: [1, 2] },
    ]);
    checkDown(engine);
    // A has the best hand and wins the main pot; B beats C for the side pot.
    expect(netResults(engine, stacks)).toEqual([100, 50, -150]);
    expect(totalChips(engine)).toBe(650);
  });

  it("7. folded chips stay in the pot, and an uncalled bet comes back", () => {
    const stacks = [50, 300, 300];
    const engine = fixedTable([["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], DRY_BOARD, stacks);
    engine.deal();
    act(engine, 0, RAISE, 50); // A, all-in
    act(engine, 1, CALL);
    act(engine, 2, CALL);
    act(engine, 1, BET, 50);
    act(engine, 2, CALL); // B and C have each put in 100
    act(engine, 1, BET, 50);
    act(engine, 2, FOLD);
    // The river is dealt with no more betting, then A and B show down.
    expect(engine.state.board).toEqual(DRY_BOARD);
    expect(engine.state.winners).toEqual([
      expect.objectContaining({ seat: 1, amount: 100 }), // side pot: B alone
      expect.objectContaining({ seat: 0, amount: 150 }), // main pot: A beats B
    ]);
    expect(netResults(engine, stacks)).toEqual([100, 0, -100]);
    expect(totalChips(engine)).toBe(650);
  });
});

describe("showdown", () => {
  it("8. with equal pairs, the higher kicker wins", () => {
    const stacks = [200, 200];
    const engine = fixedTable([["As", "Kd"], ["Ac", "Qh"]], ["Ad", "8c", "4s", "9h", "2c"], stacks);
    engine.deal();
    checkDown(engine);
    expect(netResults(engine, stacks)).toEqual([2, -2]);
  });

  it("9. only the best five cards count, so the board can play for both", () => {
    const stacks = [200, 200];
    const engine = fixedTable([["Js", "Jd"], ["3c", "2d"]], ["Ad", "Ac", "Ks", "Kh", "Qc"], stacks);
    engine.deal();
    checkDown(engine);
    expect(netResults(engine, stacks)).toEqual([0, 0]);
  });

  it("10. a tie splits the pot among players who haven't folded", () => {
    const stacks = [200, 200, 200];
    const engine = fixedTable(RAGS.slice(0, 3), ROYAL_BOARD, stacks);
    engine.deal();
    act(engine, 0, CALL);
    act(engine, 1, CALL);
    act(engine, 2, CHECK); // pot is 6
    act(engine, 1, BET, 2);
    act(engine, 2, CALL);
    act(engine, 0, FOLD); // pot is 10
    checkDown(engine);
    // Seats 1 and 2 each put in 4 and get 5 back.
    expect(netResults(engine, stacks)).toEqual([-2, 1, 1]);
  });

  it("11. the odd chip goes to the first tied player left of the button", () => {
    const stacks = [200, 200, 200];
    const engine = fixedTable(RAGS.slice(0, 3), ROYAL_BOARD, stacks);
    engine.deal();
    act(engine, 0, CALL);
    act(engine, 1, FOLD);
    act(engine, 2, CHECK); // pot is 5
    checkDown(engine);
    // Seat 1 folded, so seat 2 is the first tied player left of the button.
    expect(engine.state.winners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ seat: 2, amount: 3 }),
        expect.objectContaining({ seat: 0, amount: 2 }),
      ]),
    );
    expect(netResults(engine, stacks)).toEqual([0, -1, 1]);
  });

  it("12. when both players are all-in before the flop, the board is dealt out", () => {
    const stacks = [200, 200];
    const engine = fixedTable([["As", "Ah"], ["Ks", "Kh"]], DRY_BOARD, stacks);
    engine.deal();
    act(engine, 0, RAISE, 200);
    act(engine, 1, CALL);
    expect(engine.state.actionTo).toBeNull();
    expect(engine.state.board).toEqual(DRY_BOARD);
    expect(engine.state.street).toBe(Street.SHOWDOWN);
    expect(netResults(engine, stacks)).toEqual([200, -200]);
  });
});

describe("blinds and the button", () => {
  it("14. a big blind with fewer chips than the blind is all-in, and callers still owe the full 2", () => {
    const stacks = [200, 200, 1];
    const engine = fixedTable([["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], DRY_BOARD, stacks);
    engine.deal();
    expect(engine.state.players[2]!.stack).toBe(0);
    expect(isLegal(engine, 0, CHECK)).toBe(false);
    act(engine, 0, CALL);
    expect(engine.state.currentBets.get(0)).toBe(2);
    act(engine, 1, CALL);
    // The big blind can't act, so the flop comes. Main pot: 1 from each player.
    expect(engine.state.street).toBe(Street.FLOP);
    expect(pots(engine)).toEqual([
      { amount: 3, eligibleSeats: [0, 1, 2] },
      { amount: 2, eligibleSeats: [0, 1] },
    ]);
    checkDown(engine);
    expect(netResults(engine, stacks)).toEqual([3, -2, -1]);
    expect(totalChips(engine)).toBe(401);
  });

  it("15. the button moves on after a player runs out of chips", () => {
    const stacks = [200, 200, 2];
    const engine = fixedTable([["As", "Ah"], ["Ks", "Kh"], ["Qs", "Qh"]], DRY_BOARD, stacks);
    engine.deal(); // seat 2 is all-in just by posting the big blind
    act(engine, 0, CALL);
    act(engine, 1, FOLD);
    checkDown(engine);
    expect(engine.state.players[2]!.stack).toBe(0);
    engine.deal();
    // Heads-up now: the button moves to seat 1, which posts the small blind.
    expect(engine.state.buttonSeat).toBe(1);
    expect(engine.state.currentBets.get(1)).toBe(1);
    expect(engine.state.currentBets.get(0)).toBe(2);
    expect(engine.state.actionTo).toBe(1);
  });

  it("20. when nobody is left to bet against, the cards are dealt out", () => {
    // Found by Codex on 2026-10-29. Fixed by patches/@pokertools+engine*.patch.
    const stacks = [50, 30, 200, 200];
    const engine = fixedTable(RAGS, DRY_BOARD, stacks);
    engine.deal();
    act(engine, 3, RAISE, 50);
    act(engine, 0, CALL); // all-in
    act(engine, 1, CALL); // all-in
    act(engine, 2, CALL);
    act(engine, 2, BET, 50);
    act(engine, 3, CALL);
    act(engine, 2, FOLD); // turn: seat 3 is the only player left with chips
    expect(engine.state.actionTo).toBeNull();
    expect(engine.state.board).toEqual(DRY_BOARD);
    expect(engine.state.winners).not.toBeNull();
    expect(totalChips(engine)).toBe(480);
  });

  it("21. posting the blinds can already end the betting", () => {
    // Found by Codex on 2026-10-29. Fixed by patches/@pokertools+engine*.patch.
    // Heads-up, seat 0 has kings and seat 1 aces. In each case one player is
    // all-in from the blinds and the other has already matched it.
    for (const stacks of [[1, 200], [200, 1], [2, 1]]) {
      const engine = fixedTable([["Ks", "Kh"], ["As", "Ah"]], DRY_BOARD, stacks);
      engine.deal();
      expect(engine.state.actionTo, `stacks ${stacks}`).toBeNull();
      expect(engine.state.board).toEqual(DRY_BOARD);
      // The pot is 1 from each player; anything more was returned.
      expect(netResults(engine, stacks), `stacks ${stacks}`).toEqual([-1, 1]);
    }
  });

  it("16. a rejected action leaves the game unchanged", () => {
    const engine = fixedTable(RAGS.slice(0, 3), DRY_BOARD, [200, 200, 200]);
    engine.deal();
    const before = engine.snapshot;
    expect(() => act(engine, 0, RAISE, 3)).toThrow(); // below the minimum raise
    expect(() => engine.act({ type: CHECK, playerId: "p1" })).toThrow(); // not seat 1's turn
    expect(engine.snapshot).toEqual(before);
  });
});

describe("hand comparisons", () => {
  // The evaluator's score: a lower number is a stronger hand.
  const score = (cards: string) => evaluateStrings(cards.split(" "));

  it("17. A-2-3-4-5 is a straight, the lowest one", () => {
    expect(rankDescription(rankBoard("As 2d 3c 4h 5s"))).toBe("Straight");
    expect(score("As 2d 3c 4h 5s")).toBeGreaterThan(score("2s 3d 4c 5h 6s"));
    // The ace can't go "around the corner": Q-K-A-2-3 is not a straight.
    expect(rankDescription(rankBoard("Qs Kd Ac 2h 3s"))).toBe("High Card");
  });

  it("18. flush against flush: compare the highest card, then the next", () => {
    expect(score("Ah 9h 7h 4h 2h")).toBeLessThan(score("Kh Qh Jh 9h 7h"));
    expect(score("Ah Kh 7h 4h 3h")).toBeLessThan(score("As Ks 7s 4s 2s"));
  });

  it("19. full house against full house: the three of a kind decides first", () => {
    expect(score("4s 4d 4c 2h 2s")).toBeLessThan(score("3s 3d 3c Ah As"));
    // Same three of a kind (possible with a shared board): the pair decides.
    expect(score("Qs Qd Qc 9h 9s")).toBeLessThan(score("Qs Qd Qc 5h 5s"));
  });
});
