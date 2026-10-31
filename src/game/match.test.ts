import { describe, expect, it } from "vitest";
import { BOT_SEAT, Match, YOU_SEAT, type BotPolicy } from "./match";
import type { LegalMoves, Move } from "./types";

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

/** Any legal move, chosen at random (sizes too). */
function randomMove(legal: LegalMoves, random: () => number): Move {
  const options: Move[] = [];
  if (legal.check) options.push({ type: "check" });
  if (legal.call !== null) options.push({ type: "call" }, { type: "fold" });
  const sized = (range: { min: number; max: number }) => range.min + Math.floor(random() * (range.max - range.min + 1));
  if (legal.bet) options.push({ type: "bet", to: sized(legal.bet) });
  if (legal.raise) options.push({ type: "raise", to: sized(legal.raise) });
  return options[Math.floor(random() * options.length)];
}

const randomBot: BotPolicy = (_view, legal, random) => randomMove(legal, random);

describe("Match", () => {
  it("plays many hands and matches, recording each hand consistently", () => {
    const random = seeded(11);
    const match = new Match({ bot: randomBot, random, botRandom: seeded(12) });
    let hands = 0;
    const matchesSeen = new Set<number>();
    for (let n = 0; n < 400; n++) {
      match.dealNext();
      const record = match.current!;
      matchesSeen.add(record.matchNumber);
      while (!match.handOver) {
        const before = match.view();
        // The learner never sees the bot's cards before the hand is over.
        const botCards = before.seats[BOT_SEAT]!.cards;
        expect(botCards === null || botCards.every((card) => card === null)).toBe(true);
        expect(match.act(randomMove(match.legalMoves()!, random))).toEqual({ ok: true });
      }
      hands++;
      const final = record.final!;
      const seats = final.seats;
      expect(seats[YOU_SEAT]!.stack + seats[BOT_SEAT]!.stack).toBe(400);
      expect(record.net).toBe(seats[YOU_SEAT]!.stack - record.startStacks[YOU_SEAT]);
      for (const [i, step] of record.moves.entries()) {
        if (step.actorSeat === YOU_SEAT) expect(step.legal).not.toBeNull();
        expect(step.view.viewerSeat).toBe(YOU_SEAT);
        // Each move's "after" view is the next move's "before" view.
        if (i + 1 < record.moves.length) expect(record.moves[i + 1].view).toEqual(step.after);
      }
      if (record.moves.length) expect(record.moves.at(-1)!.after).toEqual(final);
    }
    expect(hands).toBe(400);
    expect(matchesSeen.size).toBeGreaterThan(1); // someone busted and a new match began
  });

  it("alternates the button between hands", () => {
    const match = new Match({ bot: () => ({ type: "fold" }), random: seeded(3), botRandom: seeded(4) });
    const buttons: (number | null)[] = [];
    for (let n = 0; n < 4; n++) {
      match.dealNext();
      buttons.push(match.view().buttonSeat);
      while (!match.handOver) match.act({ type: "fold" });
    }
    expect(buttons).toEqual([0, 1, 0, 1]);
  });

  it("refuses an illegal learner move without recording it", () => {
    const match = new Match({ bot: () => ({ type: "call" }), random: seeded(5), botRandom: seeded(6) });
    match.dealNext();
    while (match.handOver) match.dealNext();
    const before = match.current!.moves.length;
    expect(match.act({ type: "raise", to: 1 }).ok).toBe(false);
    expect(match.current!.moves.length).toBe(before);
  });

  it("gives the bot only its own view", () => {
    const seen: ((string | null)[] | null)[] = [];
    const spy: BotPolicy = (view, legal) => {
      seen.push(view.seats[YOU_SEAT]!.cards);
      expect(view.viewerSeat).toBe(BOT_SEAT);
      expect(view.seats[BOT_SEAT]!.cards).toHaveLength(2);
      return legal.check ? { type: "check" } : { type: "call" };
    };
    const match = new Match({ bot: spy, random: seeded(9), botRandom: seeded(10) });
    for (let n = 0; n < 5; n++) {
      match.dealNext();
      while (!match.handOver) match.act(match.legalMoves()!.check ? { type: "check" } : { type: "call" });
    }
    expect(seen.length).toBeGreaterThan(5);
    expect(seen.every((cards) => cards === null || cards.every((card) => card === null))).toBe(true);
  });
});
