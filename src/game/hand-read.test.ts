import { describe, expect, it } from "vitest";
import { isUnbeatable, readHand } from "./hand-read";

const strength = (hole: string, board: string) => readHand(hole.split(" "), board.split(" ")).strength;

describe("readHand", () => {
  it("rates hands by what the player's own cards add", () => {
    expect(strength("7c 7d", "7h Kd 2s")).toBe("strong"); // a set
    expect(strength("Kc 9d", "Kh 9s 2d")).toBe("strong"); // two pair with both cards
    expect(strength("Ac Kd", "As 9s 2d")).toBe("topPair");
    expect(strength("Qc Qd", "Js 9s 2d")).toBe("topPair"); // an overpair
    expect(strength("9c 8d", "Ks 9s 2d")).toBe("lowerPair");
    expect(strength("5c 5d", "Ks 9s 2d")).toBe("lowerPair");
    expect(strength("Ac 4d", "Ks 9s 2d")).toBe("aceHigh");
    expect(strength("7c 4d", "Ks 9s 2d")).toBe("nothing");
  });

  it("doesn't count a pair on the board as the player's", () => {
    expect(strength("Ac 4d", "Ks Kd 2h")).toBe("aceHigh");
    // One private pair plus a board pair stays in the one-pair group.
    expect(strength("9c 8d", "9s Kd Kh")).toBe("lowerPair");
    expect(strength("7c 4d", "Ks Kd 7h")).toBe("lowerPair");
    expect(strength("7c 4d", "Ks Kd 2h 2c 9d")).toBe("nothing");
  });

  it("treats straights and flushes as strong unless the board threatens them", () => {
    expect(strength("8c 7d", "9s 6h 5d")).toBe("strong");
    expect(strength("8c 7d", "9s 6s 5s")).toBe("topPair"); // a flush is possible
    expect(strength("As 2s", "Ks 9s 4s")).toBe("strong");
    expect(strength("As 2s", "Ks 9s 4s 4d")).toBe("topPair"); // a full house is possible
    expect(strength("3s 2d", "Ks 9s 4s Js")).toBe("topPair"); // a low flush on a four-flush board
    expect(strength("Kc Qd", "As Ks Qs Js Ts")).toBe("nothing"); // the board's royal flush isn't theirs
  });

  it("finds draws and the cards that complete them, each counted once", () => {
    const flush = readHand(["Ah", "4h"], ["Kh", "9h", "2c"]);
    expect(flush.flushDraw).toBe(true);
    expect(flush.drawCards).toHaveLength(9);
    const open = readHand(["8c", "7d"], ["6h", "5s", "Kc"]);
    expect(open.straightDraw).toBe("open");
    expect(open.drawCards).toHaveLength(8);
    expect(readHand(["9c", "7d"], ["6h", "5s", "Kc"]).straightDraw).toBe("gutshot");
    // A flush draw plus an open-ended straight draw: the two 9♥-style overlaps are counted once.
    const combo = readHand(["8h", "7h"], ["6h", "5c", "Kh"]);
    expect(combo.drawCards).toHaveLength(15);
    expect(readHand(["8h", "7h"], ["6h", "5c", "Kh", "2d", "3s"]).drawCards).toHaveLength(0); // no cards to come
  });
});

describe("isUnbeatable", () => {
  it("checks every possible opponent hand on the river", () => {
    expect(isUnbeatable(["As", "Ks"], ["Qs", "Js", "Ts", "2d", "3c"])).toBe(true); // royal flush
    expect(isUnbeatable(["Ac", "Ad"], ["As", "Kd", "7c", "2h", "9s"])).toBe(true); // nothing beats three aces here
    expect(isUnbeatable(["Ac", "Kd"], ["As", "Kh", "7c", "2h", "9s"])).toBe(false); // a set beats two pair
    expect(isUnbeatable(["2c", "3d"], ["As", "Ks", "Qs", "Js", "Ts"])).toBe(true); // everyone ties the board
  });
});
