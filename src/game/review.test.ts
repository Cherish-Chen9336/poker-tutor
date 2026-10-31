import { describe, expect, it } from "vitest";
import type { RecordedMove } from "./match";
import { commentOn, reviewHand } from "./review";
import { practiceBot } from "./bot";
import { Match } from "./match";
import type { LegalMoves, Move, TableView } from "./types";

function view(hole: string[], board: string[], opts: { pot?: number; bets?: [number, number] } = {}): TableView {
  const bets = opts.bets ?? [0, 0];
  return {
    viewerSeat: 0,
    handNumber: 1,
    street: board.length === 5 ? "river" : board.length === 4 ? "turn" : board.length === 3 ? "flop" : "preflop",
    board,
    pots: opts.pot ? [{ amount: opts.pot, eligibleSeats: [0, 1] }] : [],
    seats: [
      { seat: 0, id: "you", name: "You", stack: 150, betThisStreet: bets[0], status: "active", cards: hole },
      { seat: 1, id: "bot", name: "Bot", stack: 150, betThisStreet: bets[1], status: "active", cards: null },
    ],
    buttonSeat: 0,
    bigBlindSeat: 1,
    smallBlind: 1,
    bigBlind: 2,
    actionTo: 0,
    handOver: false,
    winners: null,
  };
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const free: LegalMoves = { fold: true, check: true, call: null, bet: { min: 2, max: 150 }, raise: null };
const facing = (call: number): LegalMoves => ({ fold: true, check: false, call, bet: null, raise: { min: call * 2, max: 150 } });
const step = (v: TableView, legal: LegalMoves, move: Move): RecordedMove => ({ actorSeat: 0, move, view: v, after: v, legal });

describe("review comments", () => {
  it("calls folding when checking was free a mistake", () => {
    expect(commentOn(step(view(["7c", "2d"], ["Ks", "9h", "4c"], { pot: 10 }), free, { type: "fold" })).verdict).toBe("mistake");
  });

  it("calls folding an unbeatable river hand a mistake, and keeping it good", () => {
    const nuts = view(["As", "Ks"], ["Qs", "Js", "Ts", "2d", "3c"], { pot: 40, bets: [0, 20] });
    expect(commentOn(step(nuts, facing(20), { type: "fold" })).verdict).toBe("mistake");
    expect(commentOn(step(nuts, facing(20), { type: "call" })).verdict).toBe("good");
  });

  it("explains other decisions without grading them", () => {
    const c = commentOn(step(view(["Ac", "Qd"], ["As", "9h", "4c", "2d", "7s"], { pot: 60, bets: [0, 20] }), facing(20), { type: "fold" }));
    expect(c.verdict).toBe("note");
    expect(c.text).toBe(
      "Calling cost 20 to win a pot of 100: to break even, you needed at least 20.0% of the pot on average (a tie earns your share), if the betting ended there. Whether folding was right depends on how often the bot had a better hand here, which the app can't know.",
    );
    const bet = commentOn(step(view(["8h", "7h"], ["6h", "5c", "Kh"], { pot: 12 }), free, { type: "bet", to: 8 }));
    expect(bet.text).toBe("15 unseen cards could have completed your draw, though some might still have lost. You put in 8 more, about two-thirds of the pot (12 before your move).");
  });

  it("never depends on the bot's cards, later cards, or the result", () => {
    const match = new Match({ bot: practiceBot, random: seeded(37), botRandom: seeded(61) });
    for (let n = 0; n < 60; n++) {
      match.dealNext();
      while (!match.handOver) match.act(match.legalMoves()!.check ? { type: "check" } : { type: "call" });
      const record = match.current!;
      const original = reviewHand(record);
      // Same decisions, but a different ending and nothing after each move: comments don't change.
      const altered = { ...record, final: { ...record.final!, winners: [], board: [] }, net: -999, moves: record.moves.map((m) => ({ ...m, after: m.view })) };
      expect(reviewHand(altered)).toEqual(original);
      for (const comment of original) expect(comment.text).not.toMatch(/\b(won|lost the hand|lucky|unlucky)\b/i);
    }
  });
});
