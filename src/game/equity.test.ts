import { describe, expect, it } from "vitest";
import { equityRequests, estimateEquity, sampleEquity } from "./equity";
import { oneCardOdds } from "./hands";

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

describe("equity against random hands", () => {
  it("matches well-known preflop figures within the sampling margin", () => {
    // Published all-in equities against random hands: AA about 85.2% (1 opponent),
    // 73.4% (2 opponents), 49.2% (5 opponents); 7-2 offsuit about 34.6% (1 opponent).
    const cases: [string[], number, number][] = [
      [["As", "Ah"], 1, 0.852],
      [["As", "Ah"], 2, 0.734],
      [["As", "Ah"], 5, 0.492],
      [["7c", "2d"], 1, 0.346],
    ];
    for (const [hole, opponents, published] of cases) {
      const e = sampleEquity(hole, [], opponents, 40_000, seeded(opponents * 13 + hole[0].charCodeAt(0)));
      expect(e.margin).toBeLessThan(0.01);
      expect(Math.abs(e.share - published), `${hole.join("")} vs ${opponents}`).toBeLessThan(e.margin + 0.004);
    }
  });

  it("counts a k-way tie as 1/k", () => {
    // A royal flush on the board: everyone ties, every time.
    const board = ["As", "Ks", "Qs", "Js", "Ts"];
    expect(sampleEquity(["2c", "3d"], board, 2, 500, seeded(1)).share).toBeCloseTo(1 / 3, 10);
    expect(sampleEquity(["2c", "3d"], board, 5, 500, seeded(2)).share).toBeCloseTo(1 / 6, 10);
    expect(estimateEquity(["2c", "3d"], board, 1, 500, seeded(3))).toEqual({ share: 0.5, exact: true, samples: 990, margin: 0 });
  });

  it("is exact against one opponent on the turn and river", () => {
    const river = estimateEquity(["Ah", "Kh"], ["Kd", "9h", "2c", "7s", "4d"], 1, 0, seeded(4));
    expect(river.exact).toBe(true);
    expect(river.samples).toBe(990);
    const turn = estimateEquity(["7h", "6h"], ["Kh", "9h", "2c", "3s"], 1, 0, seeded(5));
    expect(turn.samples).toBe(46 * 990); // 46 possible rivers × 990 opponent hands from the other 45 cards
    // Against a random hand, a flush draw does better than against the pair of kings in lesson 9 (20.5%).
    expect(turn.share).toBeGreaterThan(oneCardOdds(["7h", "6h"], ["Ks", "Jd"], ["Kh", "9h", "2c", "3s"]).equity);
  });

  it("agrees with exact counting when sampled", () => {
    const hole = ["Qc", "Qd"];
    const board = ["Jh", "7s", "2d", "9c"];
    const exact = estimateEquity(hole, board, 1, 0, seeded(6));
    const sampled = sampleEquity(hole, board, 1, 20_000, seeded(7));
    expect(Math.abs(sampled.share - exact.share)).toBeLessThan(sampled.margin * 1.5);
  });
});

describe("which estimates the coach asks for", () => {
  const seats = (statuses: string[]) => statuses.map((status, seat) => ({ seat, status }));

  it("asks once when there's one pot", () => {
    expect(equityRequests({ seats: seats(["active", "active", "folded", "active"]), pots: [{ eligibleSeats: [0, 1, 3] }] }, 0)).toEqual([
      { label: "the pot", opponents: 2 },
    ]);
  });

  it("asks per pot when side pots have different opponents", () => {
    // Seat 1 is all-in for the main pot only; seats 0, 2, 3 contest the side pot.
    const view = {
      seats: seats(["active", "all-in", "active", "active", "folded"]),
      pots: [{ eligibleSeats: [0, 1, 2, 3] }, { eligibleSeats: [0, 2, 3] }],
    };
    expect(equityRequests(view, 0)).toEqual([
      { label: "the main pot", opponents: 3 },
      { label: "side pot 1", opponents: 2 },
    ]);
  });
});
