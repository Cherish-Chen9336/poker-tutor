// Engine rules tests. Scenarios are described in docs/rules-scenarios.md.
import { describe, expect, it } from "vitest";
import { ActionType, Street } from "@pokertools/types";
import { act, netResults, riggedTable, totalChips } from "./test-helpers";

const { FOLD, CHECK, CALL, BET, RAISE } = ActionType;

describe("rigged deck helper", () => {
  it("deals the requested cards, in order, from the top of the deck", () => {
    // Heads-up: 4 hole cards, then burn, flop, burn, turn, burn, river.
    const engine = riggedTable(
      ["2c", "3c", "4c", "5c", "6d", "As", "Ks", "Qs", "7d", "Js", "8d", "Ts"],
      [200, 200],
    );
    engine.deal();
    const holeCards = engine.state.players.flatMap((p) => p!.hand);
    expect(holeCards.sort()).toEqual(["2c", "3c", "4c", "5c"]);
    while (engine.state.actionTo !== null) {
      const seat = engine.state.actionTo;
      const playerId = engine.state.players[seat]!.id;
      const check = { type: CHECK, playerId } as const;
      engine.act(engine.validate(check).valid ? check : { type: CALL, playerId });
    }
    expect(engine.state.board).toEqual(["As", "Ks", "Qs", "Js", "Ts"]);
  });
});

describe("pot splitting", () => {
  // Found by Codex on 2026-10-29: chips from folded players created several
  // small pots that were split separately, so odd chips all went to one
  // player (14/16 instead of 15/15). Fixed by patches/@pokertools+engine*.patch.
  it("splits a tied 30-chip pot 15/15 when three players folded after betting", () => {
    const stacks = [100, 100, 100, 100, 100];
    // 5 players x 2 hole cards, then burn + royal flush board with burns.
    const engine = riggedTable(
      [
        "2c", "3d", "4c", "5d", "6c", "7d", "8c", "9d", "2d", "3c",
        "4d", "As", "Ks", "Qs", "5c", "Js", "6d", "Ts",
      ],
      stacks,
    );
    engine.deal();
    expect(engine.state.buttonSeat).toBe(0);

    // Preflop. Seat 1 is the small blind (1), seat 2 the big blind (2).
    act(engine, 3, CALL);
    act(engine, 4, RAISE, 4);
    act(engine, 0, CALL);
    act(engine, 1, FOLD);
    act(engine, 2, FOLD);
    act(engine, 3, CALL);
    expect(totalChips(engine)).toBe(500);

    // Flop.
    expect(engine.state.street).toBe(Street.FLOP);
    act(engine, 3, BET, 3);
    act(engine, 4, RAISE, 6);
    act(engine, 0, CALL);
    act(engine, 3, FOLD);

    // Turn and river: both remaining players check.
    for (let street = 0; street < 2; street++) {
      act(engine, 4, CHECK);
      act(engine, 0, CHECK);
    }

    expect(engine.state.board).toEqual(["As", "Ks", "Qs", "Js", "Ts"]);
    // Invested: seat 0 = 10, seat 1 = 1, seat 2 = 2, seat 3 = 7, seat 4 = 10.
    // Pot = 30, shared by seats 0 and 4: each nets +5.
    expect(netResults(engine, stacks)).toEqual([5, -1, -2, -7, 5]);
    expect(totalChips(engine)).toBe(500);
  });
});
