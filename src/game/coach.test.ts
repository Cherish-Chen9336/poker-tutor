import { describe, expect, it } from "vitest";
import { coachLines } from "./coach";
import { Table } from "./table";
import type { TableView } from "./types";

/** A heads-up view for seat 0 with the given cards, board, and bets. */
function view(hole: string[], board: string[], opts: { pot?: number; bets?: [number, number]; stacks?: [number, number]; button?: number; street?: TableView["street"] } = {}): TableView {
  const street = opts.street ?? (board.length === 0 ? "preflop" : board.length === 3 ? "flop" : board.length === 4 ? "turn" : "river");
  const bets = opts.bets ?? [0, 0];
  const stacks = opts.stacks ?? [190, 190];
  return {
    viewerSeat: 0,
    handNumber: 1,
    street,
    board,
    pots: opts.pot ? [{ amount: opts.pot, eligibleSeats: [0, 1] }] : [],
    seats: [
      { seat: 0, id: "you", name: "You", stack: stacks[0], betThisStreet: bets[0], status: "active", cards: hole },
      { seat: 1, id: "bot", name: "Bot", stack: stacks[1], betThisStreet: bets[1], status: "active", cards: null },
    ],
    buttonSeat: opts.button ?? 0,
    bigBlindSeat: opts.button === 1 ? 0 : 1,
    smallBlind: 1,
    bigBlind: 2,
    actionTo: 0,
    handOver: false,
    winners: null,
  };
}

const text = (v: TableView) => coachLines(v).map((l) => l.text);

describe("coach", () => {
  it("describes position and starting hands before the flop", () => {
    expect(text(view(["Kd", "As"], [], { bets: [1, 2] }))).toEqual([
      "You have the button: you act first before the flop, and last on every later round.",
      "Your cards: {As} {Kd}: ace-king, different suits.",
      "Calling costs 1 to win a pot of 4. If the betting ended here, you'd need to win 25.0% of the time to break even. More betting may follow, which changes this math. We haven't estimated your chance of winning.",
    ]);
    expect(text(view(["7c", "7h"], [], { button: 1, bets: [2, 2] }))[1]).toBe("Your cards: {7c} {7h}: a pocket pair of 7s.");
  });

  it("names the hand, draws counted once, and board threats", () => {
    const lines = text(view(["8h", "7h"], ["6h", "5c", "Kh"], { pot: 10 }));
    expect(lines).toContain("Your best five: {Kh} {8h} {7h} {6h} {5c}, high card.");
    expect(lines).toContain("15 unseen cards could complete a flush or straight on the turn or river. Some could still lose, for example to a bigger flush or a full house.");
    expect(lines).toContain("Nothing to call: you can check for free.");
  });

  it("says when a hand is on the board and shared", () => {
    const lines = text(view(["7c", "4d"], ["Ks", "Kd", "2h", "2c", "9d"], { pot: 10 }));
    expect(lines.find((l) => l.startsWith("Your best five"))).toBe("Your best five: {Ks} {Kd} {2h} {2c} {9d}, two pair. The two pair is on the board, so the bot shares it.");
    expect(lines).toContain("The board is paired: a full house or four of a kind is possible.");
  });

  it("gives the break-even price when the call ends the betting, without estimating a chance", () => {
    const river = text(view(["Ac", "Qd"], ["As", "9h", "4c", "2d", "7s"], { pot: 60, bets: [0, 20] }));
    expect(river.at(-1)).toBe("Calling costs 20 to win a pot of 100. If the betting ended here, you'd need to win 20.0% of the time to break even. We haven't estimated your chance of winning.");
  });

  it("never tells the learner what to do, and gives no other percentages", () => {
    const samples = [
      view(["As", "Kd"], [], { bets: [1, 2] }),
      view(["8h", "7h"], ["6h", "5c", "Kh"], { pot: 10, bets: [0, 6] }),
      view(["2c", "3d"], ["As", "Ks", "Qs", "Js", "Ts"], { pot: 40, bets: [0, 40] }),
    ];
    for (const v of samples) {
      for (const line of text(v)) {
        expect(line).not.toMatch(/\b(should|must|correct|best move|you need to (call|fold|raise))\b/i);
        if (line.includes("%")) expect(line).toMatch(/to break even/);
      }
    }
  });

  it("depends only on what the learner can see", () => {
    // Same learner cards and flop; the bot's cards and the turn/river differ.
    const linesFor = (botCards: string[], later: string[]) => {
      const table = new Table({ seats: [{ id: "you", name: "You", stack: 200 }, { id: "bot", name: "Bot", stack: 200 }], smallBlind: 1, bigBlind: 2 });
      table.dealHand({ hands: [["Ah", "Qh"], botCards], board: ["Kh", "7h", "2c", ...later] });
      table.move(0, { type: "call" });
      table.move(1, { type: "check" });
      return text(table.view(0));
    };
    const a = linesFor(["9c", "9d"], ["3s", "4s"]);
    expect(linesFor(["Kc", "Kd"], ["Jh", "Ts"])).toEqual(a);
    expect(linesFor(["2d", "3d"], ["5c", "6c"])).toEqual(a);
  });
});
