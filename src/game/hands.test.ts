import { describe, expect, it } from "vitest";
import { bestFive, compareHands, handName, oneCardOdds } from "./hands";

describe("hand helpers", () => {
  it("names every hand type", () => {
    expect(handName(["As", "Ks", "Qs", "Js", "Ts"])).toBe("Royal Flush");
    expect(handName(["9h", "8h", "7h", "6h", "5h"])).toBe("Straight Flush");
    expect(handName(["Qc", "Qd", "Qh", "Qs", "7d"])).toBe("Four of a Kind");
    expect(handName(["8s", "8d", "8c", "Kh", "Ks"])).toBe("Full House");
    expect(handName(["Ad", "Jd", "8d", "4d", "2d"])).toBe("Flush");
    expect(handName(["Tc", "9d", "8s", "7h", "6c"])).toBe("Straight");
    expect(handName(["5c", "5d", "5h", "Kd", "9c"])).toBe("Three of a Kind");
    expect(handName(["Jh", "Jc", "4s", "4d", "Ac"])).toBe("Two Pair");
    expect(handName(["Ts", "Th", "Kc", "7d", "3s"])).toBe("One Pair");
    expect(handName(["Ac", "Qd", "9s", "6h", "2c"])).toBe("High Card");
  });

  it("calls the wheel a straight, but not a wrap-around", () => {
    expect(handName(["Ac", "2d", "3s", "4h", "5c"])).toBe("Straight");
    expect(handName(["Qc", "Kd", "As", "2h", "3c"])).toBe("High Card");
  });

  it("finds the 5 cards that play", () => {
    // One hole card makes the flush; the 3 of clubs doesn't play.
    expect(bestFive(["Ah", "3c", "Kh", "9h", "6h", "2h", "Ts"]).sort()).toEqual(["2h", "6h", "9h", "Ah", "Kh"].sort());
  });

  it("compares hands, including ties", () => {
    expect(compareHands(["As", "Kd"], ["Ac", "Qh"], ["Ad", "8c", "4s", "9h", "2c"])).toBe("a");
    expect(compareHands(["Ac", "2d"], ["6c", "2h"], ["3s", "4d", "5h", "Kc", "9s"])).toBe("b");
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], ["Qd", "Jc", "Th", "2s", "3c"])).toBe("tie");
  });

  it("counts winning river cards exactly", () => {
    // Lesson 9: a heart flush draw against a pair of kings.
    expect(oneCardOdds(["7h", "6h"], ["Ks", "Jd"], ["Kh", "9h", "2c", "3s"])).toEqual({ wins: 9, ties: 0, total: 44, equity: 9 / 44 });
    // Identical ranks with no flush possible: every river card ties, and a tie counts as half a win.
    expect(oneCardOdds(["Ah", "2c"], ["As", "2d"], ["Kc", "Qd", "Jh", "9s"])).toEqual({ wins: 0, ties: 44, total: 44, equity: 0.5 });
  });
});
