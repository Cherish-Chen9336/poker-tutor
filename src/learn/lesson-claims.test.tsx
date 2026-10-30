// Facts stated in lesson text (not quizzes). Each test reads the lesson as the
// app renders it and as docs/lessons.md states it, then checks the fact with
// the evaluator, the engine (Table), or exact math.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import lessonsDoc from "../../docs/lessons.md?raw";
import { compareHands, handName } from "../game/hands";
import { Table } from "../game/table";
import type { Move } from "../game/types";
import { Lesson3, Lesson6 } from "./content/rules-lessons";
import { Lesson9 } from "./content/thinking-lessons";

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
});
