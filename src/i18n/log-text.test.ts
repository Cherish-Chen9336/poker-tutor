// The hand log worded from facts must say exactly what hand-log.ts says in
// English, for every kind of hand: folds, showdowns, all-ins, run-outs,
// split pots, side pots, and bots topped up after busting.
import { createIntl } from "react-intl";
import { describe, expect, it } from "vitest";
import { practiceBot } from "../game/bot";
import { tableBot } from "../game/bot2";
import { handLog, moveSentence, resultLine } from "../game/hand-log";
import { handFacts, moveFactAt, resultFact } from "../game/log-facts";
import { Match, type HandRecord } from "../game/match";
import type { LegalMoves, Move } from "../game/types";
import { potLabel, potText } from "../ui/labels";
import { reviewHand } from "../game/review";
import { wordLog } from "./log-text";
import { wordComment } from "./review-text";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

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

/** The learner plays randomly, often all-in, so every kind of ending happens. */
function randomMove(legal: LegalMoves, r: () => number): Move {
  const x = r();
  const range = legal.bet ?? legal.raise;
  if (range && x < 0.25) return { type: legal.bet ? "bet" : "raise", to: x < 0.12 ? range.max : range.min + Math.floor(r() * (range.max - range.min + 1)) };
  if (x < 0.35) return { type: "fold" };
  return legal.check ? { type: "check" } : { type: "call" };
}

function playedHands(players: 2 | 6, hands: number, seed: number): HandRecord[] {
  const match = new Match({ bot: players === 2 ? practiceBot : tableBot, players, random: seeded(seed), botRandom: seeded(seed + 1) });
  const r = seeded(seed + 2);
  const records: HandRecord[] = [];
  for (let n = 0; n < hands; n++) {
    match.dealNext();
    while (!match.handOver) match.act(randomMove(match.legalMoves()!, r));
    records.push(match.current!);
  }
  return records;
}

const english = createIntl({ locale: "en", messages: en });
const records = [...playedHands(2, 600, 11), ...playedHands(6, 600, 21)];

describe("the hand log from facts", () => {
  it("covers every kind of ending in this sample", () => {
    const kinds = new Set(records.flatMap((r) => handFacts(r)).flatMap((f) => (f.kind === "result" ? [`result:${f.result.kind}`] : [f.kind])));
    expect([...kinds].sort()).toEqual(
      ["blinds", "deal", "move", "result:allPots", "result:pots", "result:split", "result:win", "runOut", "show", "topUp", "yourCards"].sort(),
    );
    expect(records.some((r) => handFacts(r).some((f) => f.kind === "move" && f.allIn))).toBe(true);
  });

  it("says in English exactly what hand-log.ts says", () => {
    for (const record of records) {
      expect(handFacts(record).map((f) => wordLog(english, f))).toEqual(handLog(record));
      record.moves.forEach((_, i) => expect(wordLog(english, moveFactAt(record, i))).toBe(moveSentence(record, i)));
      expect(wordLog(english, { kind: "result", result: resultFact(record.final!, record.seats), net: record.net! })).toBe(
        resultLine(record.final!, record.net!, record.seats),
      );
    }
  });

  it("never names the engine's 'Uncontested' label as a hand", () => {
    const uncontested = records.filter((r) => r.final!.winners?.some((w) => w.description === "Uncontested"));
    expect(uncontested.length).toBeGreaterThan(0);
    for (const record of uncontested) expect(handLog(record).join(" ")).not.toMatch(/uncontested/i);
  });

  it("words every Review comment exactly as the English comment", () => {
    const kinds = new Set<string>();
    for (const record of records) {
      for (const c of reviewHand(record)) {
        expect(wordComment(english, c.fact)).toBe(c.text);
        kinds.add(c.fact.kind === "note" ? (c.fact.parts.length ? `note:${c.fact.parts.map((p) => p.kind).join("+")}` : "note:chose") : c.fact.kind);
      }
    }
    for (const kind of ["freeFold", "unbeatable"]) expect([...kinds], kind).toContain(kind);
    // The fallback when nothing else applies never comes up in these hands, so check it directly.
    const chose = (move: Move, call: number | null) => wordComment(english, { kind: "note", parts: [], chose: move, call });
    expect(chose({ type: "call" }, 4)).toBe("You chose to call 4.");
    expect(chose({ type: "call" }, null)).toBe("You chose to call.");
    expect(chose({ type: "raise", to: 12 }, 4)).toBe("You chose to raise to 12.");
    for (const part of ["price", "draw", "size", "foldDepends", "callDepends", "checkFree"]) expect([...kinds].join(" "), part).toContain(part);
  });

  it("labels the pot exactly as the English pot label did", () => {
    for (const record of records) {
      const names = record.seats.length > 2 ? record.seats.map((s) => s.name) : undefined;
      for (const view of [...record.moves.map((m) => m.view), record.final!]) {
        expect(potText(english, view, record.learnerSeat, names)).toBe(potLabel(view, record.learnerSeat, names));
      }
    }
  });

  it("words hands saved before per-pot results, too", () => {
    const record = records.find((r) => r.seats.length === 2 && r.final!.potResults?.length === 1)!;
    for (const winners of [[{ seat: 0, amount: 4, bestHand: null, description: "One Pair" }], [{ seat: 0, amount: 2, bestHand: null, description: null }, { seat: 1, amount: 2, bestHand: null, description: null }]]) {
      const final = { ...record.final!, potResults: undefined, winners };
      expect(wordLog(english, { kind: "result", result: resultFact(final as never, record.seats), net: 0 })).toBe(resultLine(final as never, 0, record.seats));
    }
  });

  for (const [locale, messages] of [["zh-Hans", zhHans], ["ja", ja]] as const) {
    it(`${locale}: words every log fact and comment, keeping the cards and amounts`, () => {
      const intl = createIntl({ locale, messages: { ...en, ...messages } });
      for (const record of records.slice(0, 300).concat(records.slice(600, 900))) {
        const facts = handFacts(record);
        const comments = reviewHand(record).map((c) => c.fact);
        const words = [...facts.map((f) => wordLog(intl, f)), ...comments.map((f) => wordComment(intl, f))];
        const englishWords = [...facts.map((f) => wordLog(english, f)), ...comments.map((f) => wordComment(english, f))];
        words.forEach((line, i) => {
          // No English words are left, apart from the bots' names.
          expect(line.replace(/\b(Mia|Leo|Sam|Ava|Kai)\b/g, ""), englishWords[i]).not.toMatch(/[A-Za-z]{3,}/);
          const tokens = (s: string) => [...s.matchAll(/\{[2-9TJQKA][shdc]\}/g)].map((m) => m[0]);
          expect(tokens(line), englishWords[i]).toEqual(tokens(englishWords[i]));
          const numbers = (s: string) => [...s.replace(/\{[2-9TJQKA][shdc]\}/g, "").matchAll(/\d+/g)].map((m) => m[0]).sort();
          expect(numbers(line), englishWords[i]).toEqual(numbers(englishWords[i]));
        });
      }
    });
  }
});
