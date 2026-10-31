import { describe, expect, it } from "vitest";
import { practiceBot } from "./bot";
import { handLog, moveSentence } from "./hand-log";
import { BOT_SEAT, Match, SIX_SEAT_NAMES, type HandRecord } from "./match";
import { Table } from "./table";
import type { Move } from "./types";

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
      version: 2 as const,
      botVersion: "bot-1",
      learnerSeat: 0,
      seats: [{ seat: 0, name: "You", learner: true }, { seat: 1, name: "Bot", learner: false }],
      toppedUp: [],
      matchNumber: 1,
      handNumber: 9,
      startStacks: [399, 1],
      moves: [],
      final: { viewerSeat: 0, handNumber: 9, street: "showdown", board: [], pots: [], buttonSeat: 0, bigBlindSeat: 1, smallBlind: 1, bigBlind: 2, actionTo: null, handOver: true, winners: [{ seat: 0, amount: 2, bestHand: null, description: null }], seats: [{ seat: 0, id: "you", name: "You", stack: 400, betThisStreet: 0, status: "active", cards: ["As", "Kd"] }, { seat: 1, id: "bot", name: "Bot", stack: 0, betThisStreet: 0, status: "all-in", cards: null }] } as never,
      net: 1,
    };
    expect(handLog(record)[0]).toBe("You post the small blind (1). The bot posts the big blind (1, all-in).");
  });

  it("names the blinds, top-ups, and separate pots at the six-player table", () => {
    let seed = 21;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const shove = (_v: unknown, legal: { check: boolean; raise: { max: number } | null }) =>
      legal.raise && random() < 0.5 ? { type: "raise" as const, to: legal.raise.max } : legal.check ? { type: "check" as const } : { type: "call" as const };
    const match = new Match({ bot: shove, players: 6, random, botRandom: random });
    let sawTopUp = false;
    let sawSidePot = false;
    for (let n = 0; n < 200 && !(sawTopUp && sawSidePot); n++) {
      match.dealNext();
      while (!match.handOver) match.act({ type: "fold" });
      const record = match.current!;
      const lines = handLog(record);
      const first = record.moves[0]?.view ?? record.final!;
      const names = SIX_SEAT_NAMES.map((name, i) => (i === 0 ? "You" : name));
      const small = (first.buttonSeat! + 1) % 6;
      const big = (first.buttonSeat! + 2) % 6;
      const blindLine = lines.find((l) => l.includes("the small blind"))!;
      expect(blindLine.startsWith(names[small])).toBe(true);
      expect(blindLine).toContain(`${names[big]} post`);
      if (record.toppedUp.length) {
        sawTopUp = true;
        expect(lines[0]).toMatch(/ran out of chips and is topped up to 200\.$/);
      }
      if ((record.final!.potResults?.length ?? 0) > 1) {
        sawSidePot = true;
        // Each pot on its own, or combined when one player won them all; never called a split.
        expect(lines.at(-1)).toMatch(/^Main pot: .*Side pot|^\w+ wins? all \d+ pots \(\d+ chips\)/);
        expect(lines.at(-1)).not.toMatch(/^Split pot/);
      }
    }
    expect(sawTopUp).toBe(true);
    expect(sawSidePot).toBe(true);
  });

  /** Plays fixed moves on a fixed deal and records them like a Match does. */
  function recorded(stacks: number[], hands: string[][], board: string[], moves: [number, Move][]): HandRecord {
    const table = new Table({ seats: stacks.map((stack, i) => ({ id: `p${i}`, name: i === 0 ? "You" : `Bot${i}`, stack })), smallBlind: 1, bigBlind: 2 });
    table.dealHand({ hands, board });
    const record: HandRecord = {
      version: 2, botVersion: "test", learnerSeat: 0,
      seats: stacks.map((_, seat) => ({ seat, name: seat === 0 ? "You" : `Bot${seat}`, learner: seat === 0 })),
      matchNumber: 1, handNumber: 1, startStacks: stacks, toppedUp: [], moves: [], final: null, net: null,
    };
    for (const [seat, move] of moves) {
      const view = table.view(0);
      const legal = seat === 0 ? table.legalMoves(0) : null;
      expect(table.move(seat, move).ok).toBe(true);
      record.moves.push({ actorSeat: seat, move, view, after: table.view(0), legal });
    }
    record.final = table.view(0);
    record.net = table.netResults()[0];
    return record;
  }

  it("logs a call with the engine's amount when the big blind is short", () => {
    // Seat 2, the big blind, has only 1 chip; the button (seat 0) still owes the full 2.
    const record = recorded([200, 200, 1], [["As", "Kd"], ["7c", "2d"], ["9h", "9s"]], ["2s", "5h", "Td", "Js", "3c"], [[0, { type: "call" }]]);
    expect(moveSentence(record, 0)).toBe("You call 2.");
    expect(record.moves[0].view.seats[0]!.stack - record.moves[0].after.seats[0]!.stack).toBe(2);
  });

  it("keeps a winning all-in call marked all-in", () => {
    // Heads-up: the bot raises; you (40 chips, aces) call all-in and win.
    const record = recorded([40, 200], [["As", "Ad"], ["7c", "2d"]], ["2s", "5h", "Td", "Js", "3c"], [[0, { type: "call" }], [1, { type: "raise", to: 100 }], [0, { type: "call" }]]);
    expect(record.final!.handOver).toBe(true);
    expect(record.net).toBeGreaterThan(0);
    expect(moveSentence(record, 2)).toBe("You call 38 (all-in).");
  });
});
