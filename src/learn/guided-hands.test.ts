import { describe, expect, it } from "vitest";
import { GUIDED_HANDS, YOU } from "./guided-hands";
import { GuidedRun } from "./guided-run";

function playThrough(id: number): GuidedRun {
  const run = new GuidedRun(GUIDED_HANDS.find((h) => h.id === id)!);
  while (run.pending) expect(run.tryMove(run.pending.move)).toEqual({ ok: true });
  return run;
}

describe("guided hands", () => {
  for (const hand of GUIDED_HANDS) {
    it(`hand ${hand.id} plays through the engine as scripted`, () => {
      const run = playThrough(hand.id);
      expect(run.over).toBe(true);
      expect(run.view().handOver).toBe(true);
      expect(run.table.netResults()[hand.youSeat]).toBe(hand.expectedNet);
    });

    it(`hand ${hand.id}: the coach never names the bot's cards before the end`, () => {
      const botCards = hand.hands[1 - hand.youSeat];
      for (const step of hand.script.filter((s) => s.who === YOU)) {
        for (const card of botCards) expect(step.coach ?? "").not.toContain(`{${card}}`);
      }
      expect(hand.script.filter((s) => s.who === YOU).every((s) => s.coach)).toBe(true);
    });
  }

  it("hand 1: the bot's bluff is shown at the showdown, and you win 56", () => {
    const view = playThrough(1).view();
    expect(view.board).toEqual(["Ad", "8c", "4s", "9h", "2c"]);
    expect(view.seats[1]!.cards).toEqual(["Qc", "Jc"]);
    expect(view.winners).toEqual([expect.objectContaining({ seat: 0, amount: 56, description: "One Pair" })]);
  });

  it("hand 2: folding loses only the big blind; the bot's cards stay hidden", () => {
    const view = playThrough(2).view();
    expect(view.board).toEqual([]);
    expect(view.seats[0]!.cards).toBeNull();
    expect(view.winners).toEqual([expect.objectContaining({ seat: 0, amount: 4 })]);
  });

  it("hand 3: the bot folds on the flop, so no turn, river, or showdown", () => {
    const view = playThrough(3).view();
    expect(view.board).toHaveLength(3);
    expect(view.seats[1]!.cards).toBeNull();
    expect(view.winners).toEqual([expect.objectContaining({ seat: 0, amount: 12 })]);
  });

  it("hand 4: equal hands split the pot 6 and 6", () => {
    const view = playThrough(4).view();
    expect(view.seats[0]!.cards).toEqual(["Ah", "3s"]);
    expect(view.winners?.map((w) => w.amount)).toEqual([6, 6]);
  });

  it("refuses a move the walkthrough doesn't ask for, and changes nothing", () => {
    const run = new GuidedRun(GUIDED_HANDS[0]);
    const before = JSON.stringify(run.view());
    const result = run.tryMove({ type: "fold" });
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.reason).toContain("raise to 6");
    expect(JSON.stringify(run.view())).toBe(before);
  });

  it("keeps a readable log", () => {
    expect(playThrough(1).log).toEqual([
      "You post the small blind (1). The bot posts the big blind (2).",
      "Your cards: {As} {Kd}. The bot's cards are face down.",
      "You raise to 6.",
      "The bot calls 4.",
      "Flop: {Ad} {8c} {4s}.",
      "The bot checks.",
      "You bet 8.",
      "The bot calls 8.",
      "Turn: {9h}.",
      "The bot checks.",
      "You check.",
      "River: {2c}.",
      "The bot bets 14.",
      "You call 14.",
      "You win 56 chips. You're 28 chips up.",
    ]);
  });
});
