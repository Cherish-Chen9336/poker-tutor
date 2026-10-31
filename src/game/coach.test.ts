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
      "Calling costs 1 to win a pot of 4. If the betting ended here, you'd need to win at least 25.0% of the pot on average to break even (a tie earns your share of it). More betting may follow, which changes this math. We haven't estimated your chance of winning.",
    ]);
    expect(text(view(["7c", "7h"], [], { button: 1, bets: [2, 2] }))[1]).toBe("Your cards: {7c} {7h}: a pocket pair of 7s.");
  });

  it("names the hand, draws counted once, and board threats", () => {
    const lines = text(view(["8h", "7h"], ["6h", "5c", "Kh"], { pot: 10 }));
    expect(lines).toContain("Your best five: {Kh} {8h} {7h} {6h} {5c}, high card.");
    expect(lines).toContain("15 unseen cards could complete a flush or straight on the turn or river. Even then, a stronger hand could still beat you.");
    expect(lines).toContain("Nothing to call: you can check for free.");
  });

  it("says when a hand is on the board and shared", () => {
    const lines = text(view(["7c", "4d"], ["Ks", "Kd", "2h", "2c", "9d"], { pot: 10 }));
    expect(lines.find((l) => l.startsWith("Your best five"))).toBe("Your best five: {Ks} {Kd} {2h} {2c} {9d}, two pair. The two pair is on the board, so the bot shares it.");
    expect(lines).toContain("The board is paired: a full house or four of a kind is possible.");
  });

  it("gives the break-even price when the call ends the betting, without estimating a chance", () => {
    const river = text(view(["Ac", "Qd"], ["As", "9h", "4c", "2d", "7s"], { pot: 60, bets: [0, 20] }));
    expect(river.at(-1)).toBe("Calling costs 20 to win a pot of 100. If the betting ended here, you'd need to win at least 20.0% of the pot on average to break even (a tie earns your share of it). We haven't estimated your chance of winning.");
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

  describe("at the six-player table", () => {
    /** Seat 0 is the learner; `button` sets who has the button; `folded` and `bets` adjust others. */
    function six(opts: { button: number; board?: string[]; bets?: number[]; folded?: number[]; pot?: number; street?: TableView["street"] }): TableView {
      const board = opts.board ?? [];
      const bets = opts.bets ?? [0, 0, 0, 0, 0, 0];
      return {
        viewerSeat: 0, handNumber: 1, street: opts.street ?? (board.length ? (board.length === 5 ? "river" : board.length === 4 ? "turn" : "flop") : "preflop"),
        board, pots: opts.pot ? [{ amount: opts.pot, eligibleSeats: [0, 1, 2, 3, 4, 5] }] : [],
        seats: Array.from({ length: 6 }, (_, seat) => ({
          seat, id: `p${seat}`, name: `P${seat}`, stack: 190, betThisStreet: bets[seat],
          status: (opts.folded ?? []).includes(seat) ? "folded" as const : "active" as const, cards: seat === 0 ? ["Ah", "Kd"] : null,
        })),
        buttonSeat: opts.button, bigBlindSeat: (opts.button + 2) % 6, smallBlind: 1, bigBlind: 2, actionTo: 0, handOver: false, winners: null,
      };
    }

    it("names the seat and states the order without miscounting who acts later", () => {
      // Button in seat 3: seat 0 is 3 seats left of the button, under the gun.
      expect(text(six({ button: 3, bets: [0, 0, 0, 0, 1, 2] }))[0]).toBe(
        "You're under the gun (UTG). Before the flop, betting goes around from under the gun to the big blind, and a raise gives everyone else another turn. After the flop, you act third on later rounds if everyone stays in.",
      );
      expect(text(six({ button: 0, bets: [0, 1, 2, 0, 0, 0], folded: [3, 4] }))[0]).toBe(
        "You're on the button (BTN). Before the flop, betting goes around from under the gun to the big blind, and a raise gives everyone else another turn. After the flop, you act last on every later round.",
      );
      expect(text(six({ button: 4, bets: [2, 0, 0, 0, 0, 1] }))[0]).toBe("You're the big blind (BB). Before the flop, betting goes around from under the gun to the big blind, and a raise gives everyone else another turn. After the flop, you act second on later rounds if everyone stays in.");
    });

    it("says where you act among the players still in after the flop", () => {
      const flop = ["9c", "5d", "2s"];
      expect(text(six({ button: 0, board: flop, pot: 12, folded: [3, 4, 5] }))[0]).toBe("You act last this round (in position). 2 opponents are still in.");
      expect(text(six({ button: 5, board: flop, pot: 12, folded: [2, 3] }))[0]).toBe("You act first this round. 3 opponents are still in.");
      expect(text(six({ button: 4, board: flop, pot: 12, folded: [1, 2] }))[0]).toBe("You act second of the 4 players who can still bet. 3 opponents are still in.");
    });

    it("knows a river call doesn't end the betting while someone else can still act", () => {
      const river = ["9c", "5d", "2s", "Jh", "4c"];
      // Seat 1 bet 20; seat 2 hasn't acted yet, so a call might not close the betting.
      const waiting = text(six({ button: 5, board: river, pot: 40, bets: [0, 20, 0, 0, 0, 0], folded: [3, 4, 5] })).at(-1)!;
      expect(waiting).toMatch(/More betting may follow/);
      // Seat 2 already called: a call now ends the betting.
      const closing = text(six({ button: 5, board: river, pot: 40, bets: [0, 20, 20, 0, 0, 0], folded: [3, 4, 5] })).at(-1)!;
      expect(closing).not.toMatch(/More betting may follow/);
    });

    it("says a board hand is shared by everyone still in", () => {
      const v = six({ button: 0, board: ["Ks", "Kd", "2h", "2c", "9d"], pot: 12, folded: [3, 4, 5] });
      v.seats[0]!.cards = ["7c", "4d"];
      expect(text(v).find((l) => l.startsWith("Your best five"))).toMatch(/so everyone still in shares it\.$/);
    });
  
    it("counts only players who can still bet when saying where you'll act later", () => {
      // Button in seat 3, so you (seat 0) are under the gun; the big blind (seat 5) is all-in.
      const view = six({ button: 3, bets: [0, 0, 0, 0, 1, 2] });
      view.seats[5] = { ...view.seats[5]!, stack: 0, status: "all-in" };
      expect(text(view)[0]).toMatch(/After the flop, you act second on later rounds if everyone stays in\.$/);
    });
  });
});
