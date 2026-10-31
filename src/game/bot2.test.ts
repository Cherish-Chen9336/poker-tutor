import { describe, expect, it } from "vitest";
import { handKey, OPENING, range, tableBot } from "./bot2";
import { Match, type BotPolicy } from "./match";
import { sizedTo } from "./pot-math";
import { Table } from "./table";
import type { LegalMoves, Move, TableView } from "./types";

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

const combos = (keys: Set<string>) => [...keys].reduce((sum, k) => sum + (k.length === 2 ? 6 : k.endsWith("s") ? 4 : 12), 0);
const pct = (keys: Set<string>) => ((combos(keys) / 1326) * 100).toFixed(1);

describe("bot-2 starting-hand charts", () => {
  it("reads range notation", () => {
    expect([...range("TT+")]).toEqual(["TT", "JJ", "QQ", "KK", "AA"]);
    expect([...range("22-44")]).toEqual(["22", "33", "44"]);
    expect([...range("KTs+")]).toEqual(["KTs", "KJs", "KQs"]);
    expect([...range("A2o-A4o")]).toEqual(["A2o", "A3o", "A4o"]);
    expect(handKey(["Kd", "As"])).toBe("AKo");
    expect(handKey(["7h", "7c"])).toBe("77");
    expect(() => range("XYz")).toThrow();
  });

  it("opens about 1 in 7 hands under the gun and about 1 in 3 on the button", () => {
    expect([combos(OPENING.UTG), pct(OPENING.UTG)]).toEqual([178, "13.4"]);
    expect([combos(OPENING.HJ), pct(OPENING.HJ)]).toEqual([224, "16.9"]);
    expect([combos(OPENING.CO), pct(OPENING.CO)]).toEqual([294, "22.2"]);
    expect([combos(OPENING.BTN), pct(OPENING.BTN)]).toEqual([462, "34.8"]);
  });
});

type Learner = (legal: LegalMoves, view: TableView, random: () => number) => Move;
const checkCall: Learner = (legal) => (legal.check ? { type: "check" } : { type: "call" });
const styles: Record<string, Learner> = {
  "always call": checkCall,
  "minimum raises": (legal) => (legal.raise ? { type: "raise", to: legal.raise.min } : legal.bet ? { type: "bet", to: legal.bet.min } : checkCall(legal, null!, null!)),
  "oversized bets": (legal, view) => {
    const to = sizedTo(view, 0, legal, 2);
    return to !== null && legal.bet ? { type: "bet", to } : to !== null && legal.raise ? { type: "raise", to } : checkCall(legal, view, null!);
  },
  "all-in every hand": (legal) => (legal.raise ? { type: "raise", to: legal.raise.max } : legal.bet ? { type: "bet", to: legal.bet.max } : checkCall(legal, null!, null!)),
  // Raise when nobody has raised yet before the flop; otherwise fold to any bet, check when free.
  // Several sizes: a defense that suddenly narrows above one size could be beaten just past it.
  ...Object.fromEntries(
    [5, 7, 10, 16].map((to) => [
      `steal the blinds, raising to ${to}`,
      ((legal, view) => {
        const unopened = view.street === "preflop" && Math.max(...view.seats.map((s) => s!.betThisStreet)) <= view.bigBlind;
        if (unopened && legal.raise) return { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, to)) };
        return legal.check ? { type: "check" } : { type: "fold" };
      }) as Learner,
    ]),
  ),
};

/** The learner's results against five copies of bot-2, in big blinds per 100 hands, with a 95% margin. */
function benchmark(learner: Learner, seeds: number, hands: number) {
  const results: number[] = [];
  for (let s = 1; s <= seeds; s++) {
    const random = seeded(s * 7919);
    const match = new Match({ bot: tableBot as BotPolicy, players: 6, random: seeded(s * 31), botRandom: seeded(s * 97) });
    for (let n = 0; n < hands; n++) {
      match.dealNext(); // throws if a bot ever picks an illegal move
      while (!match.handOver) expect(match.act(learner(match.legalMoves()!, match.view(), random))).toEqual({ ok: true });
      results.push(match.current!.net! / 2);
    }
  }
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const sd = Math.sqrt(results.reduce((a, b) => a + (b - mean) ** 2, 0) / (results.length - 1));
  const margin = (1.96 * sd) / Math.sqrt(results.length);
  return { per100: mean * 100, margin: margin * 100 };
}

describe("bot-2 at the six-player table", () => {
  // A regression benchmark, not proof the bot can't be beaten (fixed seeds, 3,200 hands per style).
  // Tuning used other seeds; a fresh-seed check gave every steal size a loss (−7 to −42 per 100 hands).
  it("never chooses an illegal move, and no one-trick style clearly beats it", () => {
    for (const [name, learner] of Object.entries(styles)) {
      const { per100, margin } = benchmark(learner, 8, 400);
      // Not even the low end of the 95% range is a profit.
      expect(per100 - margin, `${name}: ${per100.toFixed(0)} ± ${margin.toFixed(0)}`).toBeLessThan(0);
      // Stealing used to win (about +29 per 100 hands raising to 6, then +32 raising to 7 until the defense
      // stopped narrowing suddenly above 3 big blinds); the other styles lose clearly.
      if (!name.startsWith("steal")) expect(per100 + margin, name).toBeLessThan(0);
    }
  }, 60_000); // 16,000 hands take a few seconds

  it("decides the same way whatever the hidden cards are", () => {
    // The bot in seat 3 (under the gun) keeps its cards; the other hands and the turn and river change.
    const variants = [
      { others: [["2c", "3d"], ["9h", "9s"], ["Jd", "Tc"], ["4h", "5h"], ["Ks", "Qs"]], later: ["2s", "7c"] },
      { others: [["Qc", "Qd"], ["6h", "2s"], ["8d", "8c"], ["Ah", "3h"], ["Tc", "4s"]], later: ["Jc", "5d"] },
    ];
    const decisions = variants.map(({ others, later }) => {
      const hands = [others[0], others[1], others[2], ["Ac", "Kh"], others[3], others[4]];
      const table = new Table({ seats: Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, stack: 200 })), smallBlind: 1, bigBlind: 2 });
      table.dealHand({ hands, board: ["Kd", "7h", "2d", ...later] });
      const random = seeded(4);
      const moves: string[] = [];
      const history: { seat: number; street: TableView["street"]; move: Move }[] = [];
      while (!table.view(null).handOver && table.view(null).board.length <= 3) {
        const seat = table.view(null).actionTo!;
        const legal = table.legalMoves(seat)!;
        const street = table.view(null).street;
        const move = seat === 3 ? tableBot(table.view(3), legal, random, history) : checkCall(legal, null!, null!);
        if (seat === 3) moves.push(JSON.stringify(move));
        history.push({ seat, street, move });
        expect(table.move(seat, move).ok).toBe(true);
      }
      return moves;
    });
    expect(decisions[0].length).toBeGreaterThan(1);
    expect(decisions[1]).toEqual(decisions[0]);
  });
});
