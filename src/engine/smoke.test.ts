// Step 1 smoke test: confirms the poker libraries install, run, and agree
// with an independent hand ranker. Detailed rules tests are in scenarios.test.ts.
import { describe, expect, it } from "vitest";
import { createBrowserEngine } from "@pokertools/engine/browser";
import { evaluateStrings, rankBoard, rankDescription } from "@pokertools/evaluator";
import { ActionType, Street } from "@pokertools/types";
import pokersolver from "pokersolver";
import { totalChips } from "./test-helpers";

const { Hand } = pokersolver;

function newHeadsUpTable() {
  const engine = createBrowserEngine({ smallBlind: 1, bigBlind: 2, maxPlayers: 6 });
  engine.sit(0, "you", "You", 200);
  engine.sit(1, "bot", "Bot", 200);
  engine.deal();
  expect(totalChips(engine)).toBe(400); // blinds are counted while still in front of players
  return engine;
}

describe("engine", () => {
  it("plays a checked-down hand to showdown without losing chips", () => {
    const engine = newHeadsUpTable();
    while (engine.state.actionTo !== null) {
      const playerId = engine.state.players[engine.state.actionTo]!.id;
      const check = { type: ActionType.CHECK, playerId } as const;
      engine.act(engine.validate(check).valid ? check : { type: ActionType.CALL, playerId });
    }
    expect(engine.state.board).toHaveLength(5);
    expect(engine.state.winners?.length).toBeGreaterThan(0);
    expect(totalChips(engine)).toBe(400);
  });

  it("gives the pot to the big blind when the small blind folds", () => {
    const engine = newHeadsUpTable();
    // Heads-up, the small blind acts first before the flop.
    const smallBlind = engine.state.players[engine.state.actionTo!]!;
    expect(smallBlind.betThisStreet).toBe(1);
    engine.act({ type: ActionType.FOLD, playerId: smallBlind.id });
    expect(engine.state.street).toBe(Street.SHOWDOWN);
    // Only 1 of the big blind's 2 chips was matched, so the other 1 is
    // refunded and the contested pot is 2.
    expect(engine.state.winners).toEqual([expect.objectContaining({ seat: 1, amount: 2 })]);
    expect(engine.state.players[1]!.stack).toBe(201);
    expect(totalChips(engine)).toBe(400);
  });
});

const RANKS = "23456789TJQKA";
const SUITS = "shdc";
const DECK = [...RANKS].flatMap((r) => [...SUITS].map((s) => r + s));

function drawCards(count: number): string[] {
  const deck = [...DECK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}

// pokersolver uses slightly different category names.
function normalizeName(name: string): string {
  return ({ "Royal Flush": "Straight Flush", Pair: "One Pair" } as Record<string, string>)[name] ?? name;
}

describe("evaluator cross-check against pokersolver", () => {
  it("agrees on the hand category for 5,000 random 7-card hands", () => {
    for (let i = 0; i < 5000; i++) {
      const cards = drawCards(7);
      const ours = rankDescription(rankBoard(cards.join(" ")));
      const theirs = normalizeName(Hand.solve(cards).name);
      expect(ours, cards.join(" ")).toBe(theirs);
    }
  });

  it("agrees on who wins for 5,000 random two-player showdowns", () => {
    for (let i = 0; i < 5000; i++) {
      const cards = drawCards(9);
      const board = cards.slice(4);
      const a = [...cards.slice(0, 2), ...board];
      const b = [...cards.slice(2, 4), ...board];
      const scoreA = evaluateStrings(a);
      const scoreB = evaluateStrings(b);
      const ours = scoreA === scoreB ? "tie" : scoreA < scoreB ? "a" : "b"; // lower score wins
      const handA = Hand.solve(a);
      const handB = Hand.solve(b);
      const winners = Hand.winners([handA, handB]);
      const theirs = winners.length === 2 ? "tie" : winners[0] === handA ? "a" : "b";
      expect(ours, `${a.join(" ")} vs ${b.join(" ")}`).toBe(theirs);
    }
  });
});
