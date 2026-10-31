import { describe, expect, it } from "vitest";
import { handKey, OPENING, range, tableBot } from "./bot2";
import { readHand } from "./hand-read";
import { tableStats } from "./table-stats";
import { Match, type BotPolicy } from "./match";
import { sizedTo } from "./pot-math";
import { Table } from "./table";
import type { LegalMoves, Move, TableView } from "./types";
import type { PublicAction } from "./match";

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

  it("opens about 1 in 6 hands under the gun and about half on the button", () => {
    expect([combos(OPENING.UTG), pct(OPENING.UTG)]).toEqual([224, "16.9"]);
    expect([combos(OPENING.HJ), pct(OPENING.HJ)]).toEqual([294, "22.2"]);
    expect([combos(OPENING.CO), pct(OPENING.CO)]).toEqual([386, "29.1"]);
    expect([combos(OPENING.BTN), pct(OPENING.BTN)]).toEqual([634, "47.8"]);
  });
});

export type Learner = (legal: LegalMoves, view: TableView, random: () => number) => Move;
const checkCall: Learner = (legal) => (legal.check ? { type: "check" } : { type: "call" });
export const styles: Record<string, Learner> = {
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
    // 6/7 and 12/13 sit on each side of the big blind's defense steps (3 and 6 big blinds).
    [5, 6, 7, 10, 12, 13, 16].map((to) => [
      `steal the blinds, raising to ${to}`,
      ((legal, view) => {
        const unopened = view.street === "preflop" && Math.max(...view.seats.map((s) => s!.betThisStreet)) <= view.bigBlind;
        if (unopened && legal.raise) return { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, to)) };
        return legal.check ? { type: "check" } : { type: "fold" };
      }) as Learner,
    ]),
  ),
  // Bet two-thirds of the pot on the flop after raising first (a "continuation bet"), then give up.
  "raise to 5, then always bet the flop": (legal, view) => {
    const unopened = view.street === "preflop" && Math.max(...view.seats.map((s) => s!.betThisStreet)) <= view.bigBlind;
    if (unopened && legal.raise) return { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, 5)) };
    if (view.street === "flop" && legal.bet) return { type: "bet", to: sizedTo(view, 0, legal, 2 / 3)! };
    return legal.check ? { type: "check" } : { type: "fold" };
  },
  // Raise small, then bet half the pot whenever checked to after the flop; otherwise check or fold
  // (Codex's Step 6 verification found this won about +42 per 100 hands).
  ...Object.fromEntries(
    [5, 7].map((to) => [
      `raise to ${to}, then bet half the pot when checked to`,
      ((legal, view) => {
        const unopened = view.street === "preflop" && Math.max(...view.seats.map((s) => s!.betThisStreet)) <= view.bigBlind;
        if (unopened && legal.raise) return { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, to)) };
        if (view.street !== "preflop" && legal.bet) return { type: "bet", to: sizedTo(view, 0, legal, 0.5)! };
        return legal.check ? { type: "check" } : { type: "fold" };
      }) as Learner,
    ]),
  ),
};

/**
 * Styles that only put chips in with good hands. They can beat practice bots that call too much (that's
 * the lesson-15 note), so their results are reported, not required to lose.
 */
const valueRaise = (legal: LegalMoves, to: number): Move =>
  legal.raise ? { type: "raise", to: Math.min(legal.raise.max, Math.max(legal.raise.min, to)) } : legal.bet ? { type: "bet", to: Math.min(legal.bet.max, Math.max(legal.bet.min, to)) } : checkCall(legal, null!, null!);
const madeHand = (view: TableView) => readHand(view.seats[0]!.cards as string[], view.board).strength;
export const diagnostics: Record<string, Learner> = {
  // Plays only premium hands, raises them, and bets the pot with top pair or better.
  "value only": (legal, view) => {
    if (view.street === "preflop") return range("TT+ AQs+ AQo+").has(handKey(view.seats[0]!.cards as string[])) ? valueRaise(legal, 7) : legal.check ? { type: "check" } : { type: "fold" };
    const strength = madeHand(view);
    if (strength === "strong" || strength === "topPair") return legal.bet ? valueRaise(legal, sizedTo(view, 0, legal, 1)!) : checkCall(legal, view, null!);
    return legal.check ? { type: "check" } : { type: "fold" };
  },
  // Opens the bot's own early-seat range and calls raises with it; bets half the pot with any pair, never bluffs.
  "never bluff": (legal, view) => {
    if (view.street === "preflop") {
      if (!OPENING.UTG.has(handKey(view.seats[0]!.cards as string[]))) return legal.check ? { type: "check" } : { type: "fold" };
      const unopened = Math.max(...view.seats.map((s) => s!.betThisStreet)) <= view.bigBlind;
      return unopened ? valueRaise(legal, 5) : checkCall(legal, view, null!);
    }
    const strength = madeHand(view);
    if (strength === "nothing" || strength === "aceHigh") return legal.check ? { type: "check" } : { type: "fold" };
    return legal.bet ? valueRaise(legal, sizedTo(view, 0, legal, 0.5)!) : checkCall(legal, view, null!);
  },
  // All-in before the flop with good hands, otherwise fold (Codex's bot-2.1 review; inconclusive on fresh seeds).
  "all-in with good hands": (legal, view) => {
    if (view.street === "preflop" && range("77+ AJs+ KQs AQo+").has(handKey(view.seats[0]!.cards as string[])) && legal.raise) return { type: "raise", to: legal.raise.max };
    return legal.check ? { type: "check" } : view.street === "preflop" ? { type: "fold" } : { type: "call" };
  },
};

/**
 * The learner's results against five copies of bot-2, in big blinds per 100 hands, with a 95% margin.
 * Each seed is one session; the margin comes from how much the session averages vary (hands within a
 * session aren't independent: stacks carry over), using Student's t for the number of sessions.
 */
export function benchmark(learner: Learner, seeds: number[], hands: number) {
  const sessions: number[] = [];
  for (const s of seeds) {
    const random = seeded(s * 7919);
    const match = new Match({ bot: tableBot as BotPolicy, players: 6, random: seeded(s * 31), botRandom: seeded(s * 97) });
    let total = 0;
    for (let n = 0; n < hands; n++) {
      match.dealNext(); // throws if a bot ever picks an illegal move
      while (!match.handOver) expect(match.act(learner(match.legalMoves()!, match.view(), random))).toEqual({ ok: true });
      total += match.current!.net! / 2;
    }
    sessions.push((total / hands) * 100);
  }
  const mean = sessions.reduce((a, b) => a + b, 0) / sessions.length;
  const sd = Math.sqrt(sessions.reduce((a, b) => a + (b - mean) ** 2, 0) / (sessions.length - 1));
  if (sessions.length < 2 || sessions.length > T95.length) throw new Error(`benchmark supports 2–${T95.length} sessions`);
  const margin = (T95[sessions.length - 1] * sd) / Math.sqrt(sessions.length);
  return { per100: mean, margin };
}

/** Student's t, two-sided 95%, by degrees of freedom (1–20). */
const T95 = [NaN, 12.71, 4.3, 3.18, 2.78, 2.57, 2.45, 2.36, 2.31, 2.26, 2.23, 2.2, 2.18, 2.16, 2.14, 2.13, 2.12, 2.11, 2.1, 2.09, 2.09];

describe("bot-2 at the six-player table", () => {
  // A regression benchmark, not proof the bot can't be beaten: fixed seeds, 10 sessions of 300 hands per
  // style. Tuning (bot-2.1, 2026-10-31) used other seeds; on 12 fresh sessions of 400 hands every style
  // below lost clearly (after Codex's review fixes, the closest, stealing with a raise to 13, lost 46 ± 7 per 100 hands).
  const seeds = Array.from({ length: 10 }, (_, i) => i + 1);
  it("never chooses an illegal move, and no one-trick style beats it", () => {
    for (const [name, learner] of Object.entries(styles)) {
      const { per100, margin } = benchmark(learner, seeds, 300);
      console.info(`${name}: ${per100.toFixed(0)} ± ${margin.toFixed(0)}`);
      // Even the top of the 95% range is a loss.
      expect(per100 + margin, `${name}: ${per100.toFixed(0)} ± ${margin.toFixed(0)}`).toBeLessThan(0);
    }
  }, 120_000);

  it("reports how styles that bet only good hands do (not required to lose)", () => {
    for (const [name, learner] of Object.entries(diagnostics)) {
      const { per100, margin } = benchmark(learner, seeds, 300);
      console.info(`${name} (diagnostic): ${per100.toFixed(0)} ± ${margin.toFixed(0)}`);
      expect(Number.isFinite(per100)).toBe(true);
    }
  }, 60_000);

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

  // Practice targets from Codex (2026-10-31), with every hand starting at 100 big blinds: enough pots
  // with three or more players to practice them. PFR (raising before the flop) measures about 16%, a
  // little under Codex's provisional 17–23% (accepted by Codex); raising more often cost multi-player pots.
  // "Flop seen" counts flops someone could still bet on (not automatic run-outs after all-ins).
  it("plays loosely enough that many flops have three or more players", () => {
    const stats = tableStats(tableBot, [11, 12, 13, 14, 15, 16, 17, 18], 1000, { fixedStacks: true });
    expect(stats.flopSeen).toBeGreaterThanOrEqual(0.35);
    expect(stats.flopSeen).toBeLessThanOrEqual(0.5);
    expect(stats.multiway).toBeGreaterThanOrEqual(0.15);
    expect(stats.multiway).toBeLessThanOrEqual(0.3);
    expect(stats.vpip).toBeGreaterThanOrEqual(0.22);
    expect(stats.vpip).toBeLessThanOrEqual(0.28);
    expect(stats.pfr).toBeGreaterThanOrEqual(0.15);
    expect(stats.pfr).toBeLessThanOrEqual(0.23);
  }, 300_000);

  /**
   * Plays one hand at a six-seat table (button seat 0, small blind 1, big blind 2, under the gun 3) with
   * 200 chips each: `script` gives other seats' moves in order, and `botSeat` is played by bot-2.
   * Returns the bot's moves.
   */
  function scripted(botSeat: number, botHand: string[], script: [number, Move][], stacks = Array(6).fill(200), seed = 1): Move[] {
    const used = new Set(botHand);
    const deck = "23456789TJQKA".split("").flatMap((r) => "shdc".split("").map((x) => r + x)).filter((c) => !used.has(c));
    const hands = Array.from({ length: 6 }, (_, seat) => (seat === botSeat ? botHand : deck.splice(0, 2)));
    const table = new Table({ seats: stacks.map((stack, i) => ({ id: `p${i}`, name: `P${i}`, stack })), smallBlind: 1, bigBlind: 2 });
    table.dealHand({ hands, board: deck.slice(0, 5) });
    const history: PublicAction[] = [];
    const bot = seeded(seed);
    const botMoves: Move[] = [];
    const queue = [...script];
    while (!table.view(null).handOver && table.view(null).street === "preflop") {
      const seat = table.view(null).actionTo!;
      let move: Move;
      if (seat === botSeat) {
        move = tableBot(table.view(seat), table.legalMoves(seat)!, bot, history);
        botMoves.push(move);
      } else {
        if (!queue.length) break;
        const [who, next] = queue.shift()!;
        expect(who, "script order").toBe(seat);
        move = next;
      }
      history.push({ seat, street: "preflop", move });
      expect(table.move(seat, move).ok).toBe(true);
    }
    return botMoves;
  }
  const fold: [number, Move][] = [3, 4, 5, 0].map((seat) => [seat, { type: "fold" }]);

  /** Two cards for a hand key ("AKs" → As Ks). */
  const cardsOf = (key: string) => (key.length === 2 ? [key[0] + "s", key[1] + "h"] : [key[0] + "s", key[1] + (key[2] === "s" ? "s" : "h")]);
  const allKeys = [...range("22+ A2s+ K2s+ Q2s+ J2s+ T2s+ 92s+ 82s+ 72s+ 62s+ 52s+ 42s+ 32s A2o+ K2o+ Q2o+ J2o+ T2o+ 92o+ 82o+ 72o+ 62o+ 52o+ 42o+ 32o")];
  /** Share of combinations (from `keys`) where the bot doesn't fold at the end (calls or re-raises). */
  const callShare = (keys: string[], play: (hand: string[]) => Move[]) => {
    let calls = 0, total = 0;
    for (const key of keys) {
      const weight = combos(new Set([key]));
      total += weight;
      if (play(cardsOf(key)).at(-1)?.type !== "fold") calls += weight;
    }
    return calls / total;
  };

  it("has 169 starting hands to test with", () => expect(combos(new Set(allKeys))).toBe(1326));

  it("defends its small-blind limps against a raise of any size (Codex's bot-2.1 reviews)", () => {
    // The small blind limps hands in its button range but not its cutoff range.
    const limps = [...OPENING.BTN].filter((k) => !OPENING.SB.has(k));
    // Its best hands sometimes limp too (as a trap): with seed 7 the bot's first random number makes them limp.
    const trap = 7;
    expect(scripted(1, ["As", "Ah"], [...fold], undefined, trap)).toEqual([{ type: "call" }]);
    expect(scripted(1, ["As", "Ah"], [...fold])).toEqual([{ type: "raise", to: 5 }]);
    const traps = [...range("TT+ AQs+ AQo+")];
    for (const to of [4, 5, 7, 8, 10, 13, 20, 40, 81]) {
      const share = callShare([...limps, ...traps], (hand) => scripted(1, hand, [...fold, [2, { type: "raise", to }]], undefined, trap));
      // A raise to `to` risks to − 2 chips to win the 4 in the pot: it must not win from folds alone.
      expect(share, `raise to ${to}`).toBeGreaterThanOrEqual(4 / (4 + to - 2) - 0.02);
      expect(share, `raise to ${to}`).toBeGreaterThan(0);
    }
    // Against a raise for much of a deep stack, only the trapped strong hands go on; weak limps fold.
    for (const to of [100, 200]) {
      expect(callShare(limps, (hand) => scripted(1, hand, [...fold, [2, { type: "raise", to }]])), `raise to ${to}`).toBe(0);
      expect(callShare(traps, (hand) => scripted(1, hand, [...fold, [2, { type: "raise", to }]], undefined, trap)), `raise to ${to}`).toBe(1);
    }
    expect(scripted(1, ["Jh", "9c"], [...fold, [2, { type: "raise", to: 200 }]])).toEqual([{ type: "call" }, { type: "fold" }]);
  });

  it("an over-limp doesn't call off a deep stack with a weak hand (Codex's bot-2.1 reviews)", () => {
    // The learner limps under the gun, the hijack over-limps 6♠5♠, the big blind moves all in.
    const script: [number, Move][] = [[3, { type: "call" }], [5, { type: "fold" }], [0, { type: "fold" }], [1, { type: "fold" }], [2, { type: "raise", to: 200 }], [3, { type: "fold" }]];
    expect(scripted(4, ["6s", "5s"], script)).toEqual([{ type: "call" }, { type: "fold" }]);
  });

  it("defends its small-blind open against a small re-raise (Codex's bot-2.1 reviews)", () => {
    // Folded to the small blind, which opens to 5; the big blind re-raises to 8.
    const opens = [...OPENING.SB];
    const share = callShare(opens, (hand) => scripted(1, hand, [...fold, [2, { type: "raise", to: 8 }]]));
    // The re-raise risks 6 more chips to win the 7 in the pot.
    expect(share).toBeGreaterThanOrEqual(7 / 13 - 0.02);
    // A re-raise all in is called only with hands fit for it.
    const shove = callShare(opens.filter((k) => !range("55+ A5s+ ATo+ KQs TT+ AQs+ AQo+").has(k)), (hand) => scripted(1, hand, [...fold, [2, { type: "raise", to: 200 }]]));
    expect(shove).toBe(0);
  });

  it("the big blind defends enough against a lone raise, whatever its stack (Codex's bot-2.1 reviews)", () => {
    // Folded to the small blind, which raises; the big blind has 26 chips (13 big blinds) or 200.
    const cases: [number, number[]][] = [[26, [5, 8, 11, 14, 26]], [200, [5, 7, 11, 21, 40, 79, 80, 120, 200]]];
    for (const [bbStack, sizes] of cases) {
      let previous = 1;
      for (const to of sizes) {
        const stacks = [200, 200, bbStack, 200, 200, 200];
        const share = callShare(allKeys, (hand) => scripted(2, hand, [...fold, [1, { type: "raise", to }]], stacks));
        const added = Math.min(to, bbStack) - 1;
        expect(share, `stack ${bbStack}, raise to ${to}`).toBeGreaterThanOrEqual(3 / (3 + added) - 0.01);
        // Defense never widens as the raise grows (no gap to aim just past).
        expect(share, `stack ${bbStack}, raise to ${to}`).toBeLessThanOrEqual(previous);
        previous = share;
      }
    }
  });

  it("calls a big all-in only with hands strong enough for it (Codex's bot-2.1 reviews)", () => {
    const shove: [number, Move][] = [[3, { type: "fold" }], [4, { type: "fold" }], [5, { type: "fold" }], [0, { type: "raise", to: 200 }], [1, { type: "fold" }]];
    expect(scripted(2, ["8s", "7s"], shove)).toEqual([{ type: "fold" }]);
    expect(scripted(2, ["4h", "4d"], shove)).toEqual([{ type: "fold" }]);
    expect(scripted(2, ["Qh", "Qd"], shove)).toEqual([{ type: "call" }]);
    // A value re-raise hand that can't call an all-in doesn't sneak in: the small blind folds KQs to it.
    expect(scripted(1, ["Ks", "Qs"], shove.slice(0, 4))).toEqual([{ type: "fold" }]);
    // Facing a raise to 80, KQs doesn't move all in either.
    expect(scripted(1, ["Ks", "Qs"], [[3, { type: "fold" }], [4, { type: "fold" }], [5, { type: "fold" }], [0, { type: "raise", to: 80 }]])).toEqual([{ type: "fold" }]);
  });

  it("calls behind a player who limped, with hands that do well in multi-player pots", () => {
    // In self-play only the small blind limps, so this checks the learner limping under the gun.
    expect(scripted(4, ["5d", "4d"], [[3, { type: "call" }]])).toEqual([{ type: "call" }]);
    expect(scripted(4, ["7c", "2d"], [[3, { type: "call" }]])).toEqual([{ type: "fold" }]);
  });
});
