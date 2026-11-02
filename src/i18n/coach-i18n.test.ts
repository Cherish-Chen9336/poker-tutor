// The coach's rarer hints, built by hand so each branch is checked in every
// language: heads-up calls that end the betting, all-in and side-pot prices,
// shared boards, flush boards of every size and suit, the top hand names,
// and turn order with all-in opponents.
import { createIntl } from "react-intl";
import { describe, expect, it } from "vitest";
import { coachLines, type CoachFact, type CoachLine } from "../game/coach";
import type { SeatView, TableView } from "../game/types";
import { phraseFact } from "./coach-text";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const intls = {
  en: createIntl({ locale: "en", messages: en }),
  zh: createIntl({ locale: "zh-Hans", messages: { ...en, ...zhHans } }),
  ja: createIntl({ locale: "ja", messages: { ...en, ...ja } }),
};
const street = (board: string[]) => (board.length === 5 ? "river" : board.length === 4 ? "turn" : board.length === 3 ? "flop" : "preflop");
const seat = (n: number, s: Partial<SeatView> = {}): SeatView => ({ seat: n, id: `p${n}`, name: `P${n}`, stack: 150, betThisStreet: 0, status: "active", cards: null, ...s });

/** A table from the learner's view (seat 0). */
function table(seats: SeatView[], board: string[], extra: Partial<TableView> = {}): TableView {
  return {
    viewerSeat: 0, handNumber: 1, street: street(board), board, pots: [{ amount: 20, eligibleSeats: seats.map((s) => s.seat) }], seats,
    buttonSeat: 0, bigBlindSeat: 1, smallBlind: 1, bigBlind: 2, actionTo: 0, handOver: false, winners: null, ...extra,
  };
}
const line = (lines: CoachLine[], kind: CoachFact["kind"]) => lines.find((l) => l.fact.kind === kind)!;
/** The line in each language; the English must equal the coach's own text. */
function say(l: CoachLine) {
  const words = { en: phraseFact(intls.en, l.fact), zh: phraseFact(intls.zh, l.fact), ja: phraseFact(intls.ja, l.fact) };
  expect(words.en).toBe(l.text);
  return words;
}

describe("heads-up hints when calling ends the betting", () => {
  const cases: [string, TableView][] = [
    ["the bot is all-in before the flop", table([seat(0, { cards: ["Ah", "Kd"], betThisStreet: 1, stack: 199 }), seat(1, { status: "all-in", stack: 0, betThisStreet: 50 })], [])],
    ["the call puts you all-in on the flop", table([seat(0, { cards: ["Ah", "Kd"], stack: 20 }), seat(1, { betThisStreet: 40, stack: 100 })], ["2c", "7d", "9s"])],
    ["an ordinary call closes the river", table([seat(0, { cards: ["Ah", "Kd"] }), seat(1, { betThisStreet: 10 })], ["2c", "7d", "9s", "Jh", "3c"])],
  ];
  for (const [name, view] of cases) {
    it(`says betting ends when ${name}`, () => {
      const lines = coachLines(view);
      const words = say(lines[0]);
      expect(words.en).toBe("If you call, betting ends for this hand.");
      expect(words.zh).toBe(zhHans["coach.huCallEnds"]);
      expect(words.ja).toBe(ja["coach.huCallEnds"]);
      expect(line(lines, "price").text).toMatch(/We haven't estimated your chance of winning\.$/);
      expect(line(lines, "price").text).not.toContain("More betting may follow");
    });
  }

  it("still describes turn order when more betting can follow", () => {
    const lines = coachLines(table([seat(0, { cards: ["Ah", "Kd"] }), seat(1, { betThisStreet: 10 })], ["2c", "7d", "9s"]));
    expect(say(lines[0]).en).toBe("You act last this round, so you'll see the bot's choice first (in position).");
  });

  it("explains an all-in call without promising side pots heads-up can't have", () => {
    const words = say(line(coachLines(cases[1][1]), "price"));
    expect(words.en).toContain("If at least two opponents match extra chips beyond your total contribution");
    expect(words.en).not.toContain("keep betting into a side pot");
    expect(words.zh).toContain("若至少两名对手");
    expect(words.ja).toContain("ほかの2人以上");
  });
});

describe("prices with side pots", () => {
  it("says the pots are lumped together, in every language", () => {
    const seats = [seat(0, { cards: ["Ah", "Kd"] }), seat(1, { betThisStreet: 30 }), seat(2, { status: "all-in", stack: 0 }), seat(3, { status: "folded" })];
    const view = table(seats, ["2c", "7d", "9s"], { pots: [{ amount: 30, eligibleSeats: [0, 1, 2] }, { amount: 40, eligibleSeats: [0, 1] }] });
    const price = line(coachLines(view), "price");
    expect(price.fact).toMatchObject({ sidePots: true, allIn: false, ends: false });
    const words = say(price);
    expect(words.en).toContain("With side pots, this lumps together the pots you can win.");
    expect(words.zh).toContain("有边池时");
    expect(words.ja).toContain("サイドポットがある場合");
  });
});

describe("hands and boards", () => {
  it("says others can use a shared board, without claiming their hands are equal", () => {
    const view = table([seat(0, { cards: ["As", "7c"] }), seat(1)], ["Ks", "Kd", "2h", "4c", "9d"]);
    const best = line(coachLines(view), "bestFive");
    expect(best.fact).toMatchObject({ shared: true, headsUp: true, hand: "One Pair" });
    const words = say(best);
    expect(words.zh).toContain("机器人也能使用这个组合");
    expect(words.ja).toContain("ボットも使えます");
    expect(words.ja).not.toContain("同じです");
  });

  it("names a royal flush and a straight flush", () => {
    const royal = say(line(coachLines(table([seat(0, { cards: ["As", "Ks"] }), seat(1)], ["Qs", "Js", "Ts", "2d", "3c"])), "bestFive"));
    expect(royal.en).toContain("royal flush");
    expect(royal.zh).toContain("皇家同花顺");
    expect(royal.ja).toContain("ロイヤルフラッシュ");
    const straight = say(line(coachLines(table([seat(0, { cards: ["9h", "8h"] }), seat(1)], ["7h", "6h", "5h", "Kc", "2d"])), "bestFive"));
    expect(straight.en).toContain("straight flush");
    expect(straight.zh).toContain("同花顺");
    expect(straight.ja).toContain("ストレートフラッシュ");
  });

  it("warns about 3, 4, and 5 cards of every suit on the board", () => {
    const suitWords = { s: ["spades", "黑桃", "スペード"], h: ["hearts", "红桃", "ハート"], d: ["diamonds", "方块", "ダイヤ"], c: ["clubs", "梅花", "クラブ"] };
    const counts = { 3: ["Three", "三", "3"], 4: ["Four", "四", "4"], 5: ["Five", "五", "5"] };
    const ranks = ["2", "5", "9", "J", "K"];
    for (const suit of ["s", "h", "d", "c"] as const) {
      const other = suit === "s" ? "h" : "s";
      for (const n of [3, 4, 5] as const) {
        // n cards of the suit; the learner's cards are of other suits.
        const board = ranks.slice(0, n).map((r) => r + suit);
        const hole = ["A", "Q"].map((r) => r + other);
        const lines = coachLines(table([seat(0, { cards: hole }), seat(1)], board));
        const flush = line(lines, "boardFlush");
        expect(flush.fact).toEqual({ kind: "boardFlush", count: n, suit });
        const words = say(flush);
        [words.en, words.zh, words.ja].forEach((w, i) => {
          expect(w).toContain(suitWords[suit][i]);
          expect(w).toContain(counts[n][i]);
        });
      }
    }
  });
});

describe("turn order after the flop, with all-in players", () => {
  // Button in seat 3: after the flop the order is seat 4 (SB), 5 (BB), 0 (UTG, the learner), 1, 2, 3.
  const six = (status: Partial<Record<number, SeatView["status"]>>) =>
    table(
      [0, 1, 2, 3, 4, 5].map((n) => seat(n, { cards: n === 0 ? ["Ah", "Kd"] : null, status: status[n] ?? "active", stack: status[n] === "all-in" ? 0 : 150 })),
      ["2c", "7d", "9s"],
      { buttonSeat: 3, bigBlindSeat: 5 },
    );
  it("counts all-in players among opponents still in, but not among those who act", () => {
    const middle = say(line(coachLines(six({ 2: "folded", 3: "folded", 4: "all-in" })), "postflopPosition"));
    expect(middle.en).toBe("You act second of the 3 players who can still bet. 3 opponents are still in.");
    expect(middle.zh).toContain("第 2 个");
    expect(middle.ja).toContain("2番目");
    const first = say(line(coachLines(six({ 2: "folded", 3: "folded", 4: "all-in", 5: "folded" })), "postflopPosition"));
    expect(first.en).toBe("You act first this round. 2 opponents are still in.");
    const last = say(line(coachLines(six({ 1: "folded", 2: "folded", 3: "folded", 4: "all-in", 5: "folded" })), "postflopPosition"));
    expect(last.en).toBe("You act last this round (in position). 1 opponent is still in.");
    expect(last.zh).toContain("1 名对手");
    expect(last.ja).toContain("1人");
  });
});
