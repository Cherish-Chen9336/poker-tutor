// Facts stated in lesson text (not quizzes), checked with the evaluator,
// the engine, or exact math. Each test names the lesson that states it.
import { describe, expect, it } from "vitest";
import { compareHands, handName } from "../game/hands";
import { Table } from "../game/table";

describe("lesson text claims", () => {
  it("lesson 3: A♥ K♥ and A♠ K♠ tie on Q♦ J♣ 10♥ 2♠ 3♣, but hearts win on a three-heart board", () => {
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], ["Qd", "Jc", "Th", "2s", "3c"])).toBe("tie");
    const hearts = ["Qh", "9h", "2h", "4c", "5d"];
    expect(handName(["Ah", "Kh", ...hearts])).toBe("Flush");
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], hearts)).toBe("a");
  });

  it("lesson 6: after a short all-in raise, a player who already acted may only call or fold", () => {
    // 3 players, seat 0 on the button. B (seat 2, the big blind) has 18 chips: 2 in the blind, 16 left.
    const table = new Table({
      seats: [200, 200, 18].map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack })),
      smallBlind: 1,
      bigBlind: 2,
      random: () => 0.5,
    });
    table.dealHand();
    for (const [seat, move] of [[0, "call"], [1, "call"], [2, "check"]] as const) expect(table.move(seat, { type: move }).ok).toBe(true);
    // Flop: seat 1 (A) bets 10, seat 2 (B) goes all-in for 16, seat 0 (C) calls.
    expect(table.move(1, { type: "bet", to: 10 }).ok).toBe(true);
    expect(table.move(2, { type: "raise", to: 16 }).ok).toBe(true);
    expect(table.move(0, { type: "call" }).ok).toBe(true);
    expect(table.legalMoves(1)).toMatchObject({ fold: true, check: false, call: 6, raise: null });
  });

  it("lesson 9: the rule of 4 is close for 9 outs and overestimates for 15", () => {
    const exact = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
    expect((exact(9) * 100).toFixed(1)).toBe("35.0");
    expect((exact(15) * 100).toFixed(1)).toBe("54.1");
    // The error isn't steady: the shortcut is a little low with few outs and too high with many.
    expect(4 * 4).toBeLessThan(exact(4) * 100);
    expect(4 * 15).toBeGreaterThan(exact(15) * 100);
  });
});
