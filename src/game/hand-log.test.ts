import { describe, expect, it } from "vitest";
import { practiceBot } from "./bot";
import { handLog } from "./hand-log";
import { BOT_SEAT, Match } from "./match";

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

describe("hand log", () => {
  it("tells each hand in order, and shows the bot's cards only after a showdown", () => {
    const match = new Match({ bot: practiceBot, random: seeded(1), botRandom: seeded(2) });
    let showdowns = 0;
    for (let n = 0; n < 300; n++) {
      match.dealNext();
      while (!match.handOver) {
        const legal = match.legalMoves()!;
        match.act(legal.check ? { type: "check" } : { type: "call" });
        // While the hand is still on, the log never mentions the bot's cards.
        if (!match.handOver) expect(handLog(match.current!).some((line) => line.startsWith("The bot shows"))).toBe(false);
      }
      const record = match.current!;
      const lines = handLog(record);
      expect(lines[0]).toMatch(/posts? the small blind/);
      expect(lines[1]).toMatch(/^Your cards: \{..\} \{..\}\.$/);
      expect(lines.filter((l) => /^(You|The bot) (fold|check|call|bet|raise)/.test(l))).toHaveLength(record.moves.length);
      expect(lines.at(-1)).toMatch(/^(You win|The bot wins|Split pot)/);
      const botCards = record.final!.seats[BOT_SEAT]!.cards;
      const shown = lines.some((l) => l.startsWith("The bot shows"));
      expect(shown).toBe(Boolean(botCards?.every(Boolean)));
      if (shown) showdowns++;
    }
    expect(showdowns).toBeGreaterThan(20);
  });

  it("logs a short blind as all-in", () => {
    const record = {
      version: 1 as const,
      botVersion: "bot-1",
      matchNumber: 1,
      handNumber: 9,
      startStacks: [399, 1] as [number, number],
      moves: [],
      final: { viewerSeat: 0, handNumber: 9, street: "showdown", board: [], pots: [], buttonSeat: 0, bigBlindSeat: 1, smallBlind: 1, bigBlind: 2, actionTo: null, handOver: true, winners: [{ seat: 0, amount: 2, bestHand: null, description: null }], seats: [{ seat: 0, id: "you", name: "You", stack: 400, betThisStreet: 0, status: "active", cards: ["As", "Kd"] }, { seat: 1, id: "bot", name: "Bot", stack: 0, betThisStreet: 0, status: "all-in", cards: null }] } as never,
      net: 1,
    };
    expect(handLog(record)[0]).toBe("You post the small blind (1). The bot posts the big blind (1, all-in).");
  });
});
