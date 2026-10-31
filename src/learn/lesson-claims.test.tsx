// Facts stated in lesson text (not quizzes). Each test reads the lesson as the
// app renders it and as docs/lessons.md states it, then checks the fact with
// the evaluator, the engine (Table), or exact math.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import lessonsDoc from "../../docs/lessons.md?raw";
import { allBoardsOdds, compareHands, handName } from "../game/hands";
import { Table } from "../game/table";
import type { Move } from "../game/types";
import { Lesson3, Lesson6 } from "./content/rules-lessons";
import { Lesson9 } from "./content/thinking-lessons";
import { Lesson11, Lesson13, Lesson14 } from "./content/after-play-lessons";
import { Lesson16 } from "./content/table-lessons";

/** Visible text of a lesson, with card pictures read as their labels ("A♥" style isn't used; tokens become names). */
function shown(Lesson: () => React.ReactNode): string {
  return renderToStaticMarkup(<Lesson />)
    .replace(/<span class="ic[^"]*" role="img" aria-label="([^"]+)">.*?<\/span><\/span>/g, "[$1]")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

const docText = lessonsDoc.replace(/\*\*/g, "").replace(/\s+/g, " ");

/** Asserts the sentence appears both in the app and in the reviewed document. */
function stated(Lesson: () => React.ReactNode, sentence: string) {
  expect(shown(Lesson), "app").toContain(sentence);
  expect(docText, "docs/lessons.md").toContain(sentence);
}

function table(stacks: number[]): Table {
  const t = new Table({
    seats: stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack })),
    smallBlind: 1,
    bigBlind: 2,
    random: () => 0.5,
  });
  t.dealHand();
  return t;
}

function play(t: Table, moves: [number, Move][]) {
  for (const [seat, move] of moves) expect(t.move(seat, move), `seat ${seat} ${JSON.stringify(move)}`).toEqual({ ok: true });
}

const call: Move = { type: "call" };
const check: Move = { type: "check" };

describe("lesson text claims", () => {
  it("lesson 3: suited A-K hands tie on a board without a flush, but not on a three-heart board", () => {
    expect(shown(Lesson3)).toContain("both make the same straight and tie");
    expect(docText).toContain("both make the same straight and tie");
    stated(Lesson3, "(A suit only matters when five cards of it make a flush.");
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], ["Qd", "Jc", "Th", "2s", "3c"])).toBe("tie");
    const hearts = ["Qh", "9h", "2h", "4c", "5d"];
    expect(handName(["Ah", "Kh", ...hearts])).toBe("Flush");
    expect(compareHands(["Ah", "Kh"], ["As", "Ks"], hearts)).toBe("a");
  });

  describe("lesson 6: when a short all-in reopens the betting", () => {
    it("states the rule with its exceptions", () => {
      stated(Lesson6, "A player who already bet or raised can raise again only if the amount has gone up by at least a full raise since then.");
      stated(Lesson6, "A may call the 6 or fold, but may not raise. If A had only checked, A could raise. And if several short all-ins add up to a full raise, A may raise again.");
      stated(Lesson6, "You can always call all-in, even with fewer chips than the bet. And whenever you're allowed to raise, you may go all-in");
    });

    // 3 players, seat 0 on the button: everyone calls 2, then on the flop seat 1 acts first, then seat 2, then seat 0.
    it("A bets 10, B goes all-in for 16, C calls: A may only call 6 or fold", () => {
      const t = table([200, 200, 18]);
      play(t, [[0, call], [1, call], [2, check], [1, { type: "bet", to: 10 }], [2, { type: "raise", to: 16 }], [0, call]]);
      expect(t.legalMoves(1)).toMatchObject({ fold: true, check: false, call: 6, raise: null });
    });

    it("if A had only checked, A may raise", () => {
      const t = table([18, 200, 200]);
      play(t, [[0, call], [1, call], [2, check], [1, check], [2, { type: "bet", to: 10 }], [0, { type: "raise", to: 16 }]]);
      expect(t.legalMoves(1)?.raise?.min).toBe(26);
    });

    it("if several short all-ins add up to a full raise, A may raise again", () => {
      // 4 players: seat 3 acts first before the flop; on the flop seat 1 (A), 2 (B), 3 (C), 0 (D).
      const t = table([200, 200, 18, 22]);
      play(t, [[3, call], [0, call], [1, call], [2, check]]);
      play(t, [[1, { type: "bet", to: 10 }], [2, { type: "raise", to: 16 }], [3, { type: "raise", to: 20 }], [0, call]]);
      expect(t.legalMoves(1)?.raise?.min).toBe(30);
    });
  });

  it("lesson 9: the rule of 4 is close for 9 outs and overestimates for 15", () => {
    stated(Lesson9, "9 × 4 = 36%, while the exact chance is 35.0%. With many outs it overestimates more: 15 × 4 = 60%, but the exact chance is 54.1%.");
    const exact = (outs: number) => 1 - ((47 - outs) * (46 - outs)) / (47 * 46);
    expect((exact(9) * 100).toFixed(1)).toBe("35.0");
    expect((exact(15) * 100).toFixed(1)).toBe("54.1");
    // The error isn't steady: the shortcut is a little low with few outs and too high with many.
    expect(4 * 4).toBeLessThan(exact(4) * 100);
    expect(4 * 15).toBeGreaterThan(exact(15) * 100);
  });
  it("lesson 11: the toy game's balance points", () => {
    stated(Lesson11, "your opponent's call breaks even when 1 bet in 4 is a bluff. You get there by betting all your best hands and bluffing with 1 in 3 of your \"nothing\" hands.");
    stated(Lesson11, "If your opponent calls 2 times in 3, your bluffs break even: you win 100 one time in 3 and lose 50 two times in 3.");
    const P = 100;
    const B = 50;
    // Bet every best hand (half the time) and 1 in 3 of the "nothing" hands: 1 bet in 4 is a bluff.
    const bluffShare = (0.5 / 3) / (0.5 + 0.5 / 3);
    expect(bluffShare).toBeCloseTo(0.25);
    expect(bluffShare).toBeCloseTo(B / (P + 2 * B));
    expect(bluffShare * (P + B) - (1 - bluffShare) * B).toBeCloseTo(0); // calling breaks even
    expect((1 / 3) * P - (2 / 3) * B).toBeCloseTo(0); // bluffing breaks even against calls 2 times in 3
    expect(1 / 3).toBeCloseTo(B / (P + B)); // the fold rate at which a bluff breaks even
    stated(Lesson11, "A bluff breaks even when your opponent folds exactly B ÷ (P + B) of the time, and profits if they fold more often.");
    const bluffAt = (foldRate: number) => foldRate * P - (1 - foldRate) * B;
    expect(bluffAt(0.5)).toBeGreaterThan(0); // folding more often makes it profitable
  });

  it("lesson 13: aces against kings, and how the kings win", () => {
    stated(Lesson13, "wins 81.1% of the time, loses 18.6%, and ties 0.4% (counted over all 1,712,304 possible boards).");
    const odds = allBoardsOdds(["Ah", "As"], ["Kc", "Kd"]);
    const pct = (n: number) => ((n / odds.total) * 100).toFixed(1);
    expect([odds.total, pct(odds.wins), pct(odds.losses), pct(odds.ties)]).toEqual([1_712_304, "81.1", "18.6", "0.4"]);
    expect(compareHands(["Kc", "Kd"], ["Ah", "As"], ["Kh", "7c", "2d", "9s", "4h"])).toBe("a");
    // A king alone doesn't guarantee it: if an ace also comes, the aces' three of a kind wins.
    stated(Lesson13, "usually beat the pair of aces, unless the aces improve too, for example when an ace also comes.");
    expect(compareHands(["Kc", "Kd"], ["Ah", "As"], ["Kh", "Ac", "7c", "2d", "9s"])).toBe("b");
    // The two cases don't overlap: boards with a king, and boards without one where the kings still win.
    stated(Lesson13, "No king comes, but the kings make a straight or a flush.");
    const noKing = allBoardsOdds(["Ah", "As"], ["Kc", "Kd"], ["Kh", "Ks"]);
    expect(noKing.total).toBe(1_370_754); // boards from the 46 unseen cards other than the two kings
    const share = (n: number) => ((n / odds.total) * 100).toFixed(1);
    expect([share(odds.losses - noKing.losses), share(noKing.losses)]).toEqual(["16.0", "2.6"]);
    stated(Lesson13, "This decides about 16 boards in 100.");
    stated(Lesson13, "This decides about 2.6 boards in 100.");
  });

  it("lesson 14: Kelly's table and the twice-Kelly drag", () => {
    stated(Lesson14, "Losing 20% takes you to 80, and winning 20% from there only gets you back to 96.");
    const after = (f: number) => 100 * (1 + f) ** 55 * (1 - f) ** 45;
    expect([after(0.05), after(0.1), after(0.2)].map(Math.round)).toEqual([146, 165, 99]);
    const rate = (f: number) => 0.55 * Math.log(1 + f) + 0.45 * Math.log(1 - f);
    expect(rate(0.05) / rate(0.1)).toBeCloseTo(0.75, 2); // "about three-quarters of Kelly's speed"
    expect(100 * 0.8 * 1.2).toBeCloseTo(96);
    stated(Lesson14, "so over thousands of bets it slowly shrinks (100 becomes about 25 after 10,000 bets).");
    expect(Math.round(100 * Math.exp(10_000 * rate(0.2)))).toBe(25);
  });

  it("lesson 16: the side-pot example's numbers", () => {
    stated(Lesson16, "A wins the main pot (90). A beat both other players.");
    stated(Lesson16, "B wins the side pot (100). A can't win it, so it goes to the better hand between B and C.");
    stated(Lesson16, "C gets back 20 and loses the other 80.");
    // The engine checks of the same example are quiz verifications L16-Q1 to L16-Q3.
  });
});
