// Multi-player settlement, checked against an independent referee.
//
// The referee below works out who wins what from scratch, following the TDA
// rules: each player's contribution (an uncalled excess goes back), pots in
// layers by contribution, only players who haven't folded can win a layer,
// tied hands share it, and leftover chips go one at a time to tied winners
// starting from the first seat left of the button. Random 2–6 player hands
// where every player either folds or goes all-in are then played through the
// real engine, and every player's result must match the referee's.
import { describe, expect, it } from "vitest";
import { handScore } from "../game/hands";
import { Table } from "../game/table";
import type { Move } from "../game/types";

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

const DECK = "23456789TJQKA".split("").flatMap((r) => "shdc".split("").map((s) => r + s));

interface Referee {
  /** Chips each seat ends up with, minus what they started with. */
  net: number[];
}

/**
 * Settles a hand from contributions (after refunds), who folded, hands, and
 * the board. Seats are in table order; `button` is the button seat.
 */
function referee(contrib: number[], folded: boolean[], hands: string[][], board: string[], button: number): Referee {
  const n = contrib.length;
  const won = new Array(n).fill(0);
  const levels = [...new Set(contrib.filter((c) => c > 0))].sort((a, b) => a - b);
  // Build layers, then merge neighbouring layers that the same players can win.
  const layers: { amount: number; eligible: number[] }[] = [];
  let previous = 0;
  for (const level of levels) {
    const amount = contrib.reduce((sum, c) => sum + Math.max(0, Math.min(c, level) - previous), 0);
    const eligible = contrib.map((_, seat) => seat).filter((seat) => !folded[seat] && contrib[seat] >= level);
    const last = layers.at(-1);
    if (last && last.eligible.join() === eligible.join()) last.amount += amount;
    else layers.push({ amount, eligible });
    previous = level;
  }
  for (const layer of layers) {
    if (layer.eligible.length === 0) continue;
    const scores = layer.eligible.map((seat) => handScore([...hands[seat], ...board]));
    const best = Math.min(...scores);
    const winners = layer.eligible.filter((_, i) => scores[i] === best);
    const share = Math.floor(layer.amount / winners.length);
    for (const seat of winners) won[seat] += share;
    // Leftover chips: one each, starting with the first tied winner left of the button.
    const order = winners.sort((a, b) => ((a - button - 1 + n) % n) - ((b - button - 1 + n) % n));
    for (let i = 0; i < layer.amount - share * winners.length; i++) won[order[i]] += 1;
  }
  return { net: won.map((w, seat) => w - contrib[seat]) };
}

/** Plays one random fold-or-all-in hand on the engine and on the referee. */
function playOne(random: () => number, forceTie: boolean) {
  const n = 2 + Math.floor(random() * 5); // 2–6 players
  const stacks = Array.from({ length: n }, (_, seat) => {
    // Blinds may be short (1 chip); others get 3–300 so the first actor can always go all-in.
    const blindSeat = n === 2 ? true : seat === 1 || seat === 2;
    return blindSeat && random() < 0.2 ? 1 : 3 + Math.floor(random() * 298);
  });
  const deck = [...DECK].sort(() => random() - 0.5);
  let hands = Array.from({ length: n }, (_, i) => deck.slice(2 * i, 2 * i + 2));
  let board = deck.slice(2 * n, 2 * n + 5);
  if (forceTie) {
    // A royal flush on the board: everyone still in ties, which exercises odd chips.
    board = ["As", "Ks", "Qs", "Js", "Ts"];
    const rest = DECK.filter((c) => !board.includes(c)).sort(() => random() - 0.5);
    hands = Array.from({ length: n }, (_, i) => rest.slice(2 * i, 2 * i + 2));
  }

  const table = new Table({
    seats: stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack })),
    smallBlind: 1,
    bigBlind: 2,
    random,
  });
  table.dealHand({ hands, board });

  const folded = new Array(n).fill(false);
  let first = true;
  for (let guard = 0; guard < 50 && !table.view(null).handOver; guard++) {
    const seat = table.view(null).actionTo;
    if (seat === null) break;
    const legal = table.legalMoves(seat)!;
    let move: Move;
    if (!first && legal.call !== null && random() < 0.3) {
      move = { type: "fold" };
      folded[seat] = true;
    } else if (legal.raise) move = { type: "raise", to: legal.raise.max };
    else if (legal.bet) move = { type: "bet", to: legal.bet.max };
    else if (legal.call !== null) move = { type: "call" };
    else move = { type: "check" };
    first = false;
    const result = table.move(seat, move);
    expect(result, JSON.stringify({ stacks, seat, move })).toEqual({ ok: true });
  }
  const view = table.view(null);
  expect(view.handOver, JSON.stringify({ stacks })).toBe(true);

  const engineNet = table.netResults();
  // Contributions, worked out independently of the engine: what each seat committed,
  // then the uncalled excess goes back (nobody can lose more than the largest
  // amount someone else committed).
  // Recompute commitments independently: folders put in only their blind; everyone else went all-in.
  const blindPosted = (seat: number) => {
    const sb = n === 2 ? 0 : 1;
    const bb = n === 2 ? 1 : 2;
    if (seat === sb) return Math.min(1, stacks[seat]);
    if (seat === bb) return Math.min(2, stacks[seat]);
    return 0;
  };
  const put = stacks.map((stack, seat) => (folded[seat] ? blindPosted(seat) : stack));
  const contrib = put.map((p, seat) => Math.min(p, Math.max(0, ...put.filter((_, other) => other !== seat))));
  const expected = referee(contrib, folded, hands, board, 0);

  expect(engineNet, JSON.stringify({ stacks, folded, contrib, hands, board })).toEqual(expected.net);
  // The adapter's per-pot results add up to exactly what the engine paid each player.
  const paid = new Array(n).fill(0);
  for (const w of view.winners ?? []) paid[w.seat] += w.amount;
  const fromPots = new Array(n).fill(0);
  for (const pot of view.potResults ?? []) {
    expect(pot.winners.reduce((sum, w) => sum + w.amount, 0)).toBe(pot.amount);
    for (const w of pot.winners) {
      expect(pot.eligibleSeats).toContain(w.seat);
      fromPots[w.seat] += w.amount;
    }
  }
  expect(fromPots).toEqual(paid);
  expect(engineNet.reduce((a, b) => a + b, 0)).toBe(0);
  return { n, tie: forceTie, sidePots: new Set(contrib.filter((c, seat) => !folded[seat] && c > 0)).size > 1 };
}

describe("multi-player settlement matches an independent referee", () => {
  it("over 3,000 random fold-or-all-in hands with 2–6 players", () => {
    const random = seeded(606);
    let sixHanded = 0;
    let ties = 0;
    let withSidePots = 0;
    for (let i = 0; i < 3000; i++) {
      const result = playOne(random, i % 5 === 0);
      if (result.n === 6) sixHanded++;
      if (result.tie) ties++;
      if (result.sidePots) withSidePots++;
    }
    expect(sixHanded).toBeGreaterThan(400);
    expect(ties).toBe(600);
    expect(withSidePots).toBeGreaterThan(1000);
  });

  it("the adapter lists the lesson's main pot and side pot separately", () => {
    const table = new Table({
      seats: [{ id: "c", name: "C", stack: 100 }, { id: "a", name: "A", stack: 30 }, { id: "b", name: "B", stack: 80 }],
      smallBlind: 1,
      bigBlind: 2,
    });
    table.dealHand({ hands: [["7c", "7d"], ["Ac", "Ad"], ["Kc", "Kd"]], board: ["2s", "5h", "9d", "Js", "3c"] });
    table.move(0, { type: "raise", to: 100 });
    table.move(1, { type: "call" });
    table.move(2, { type: "call" });
    expect(table.view(null).potResults).toEqual([
      { amount: 90, eligibleSeats: [0, 1, 2], winners: [{ seat: 1, amount: 90 }] },
      { amount: 100, eligibleSeats: [0, 2], winners: [{ seat: 2, amount: 100 }] },
    ]);
  });

  it("the referee agrees with the side-pot lesson's example", () => {
    // Lesson 16: A all-in for 30, B for 80, C bets 100. A best, B second, C worst.
    const hands = [["7c", "7d"], ["Ac", "Ad"], ["Kc", "Kd"]]; // seats: C (button), A, B
    const board = ["2s", "5h", "9d", "Js", "3c"];
    expect(referee([80, 30, 80], [false, false, false], hands, board, 0).net).toEqual([-80, 60, 20]);
  });
});
