// Translated lessons as the reader sees them: each lesson's own words use
// the glossary, every quiz is translated, and the diagrams show the right
// cards and seat orders in each language.
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "react-intl";
import { describe, expect, it } from "vitest";
import { cardName } from "../learn/card-names";
import { lessonContent } from "../learn/content";
import { SEAT_LAYOUTS } from "../learn/diagram-data";
import { BestFiveRows, SeatMap } from "../learn/diagrams";
import { text as jaQuiz } from "../learn/quiz-text/ja";
import { text as zhQuiz } from "../learn/quiz-text/zh-Hans";
import { QUIZZES } from "../learn/quizzes";
import { GUIDED_HANDS } from "../learn/guided-hands";
import { guidedText } from "../learn/guided-text";
import { term } from "./glossary";
import { LocaleContext } from "./hooks";
import { en, type MessageId } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const LANGS = [
  { locale: "zh-Hans", lang: "zh", catalog: zhHans, quiz: zhQuiz },
  { locale: "ja", lang: "ja", catalog: ja, quiz: jaQuiz },
] as const;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const modules = import.meta.glob<Record<string, ComponentType>>("../learn/content/{zh-Hans,ja}/lesson*.tsx", { eager: true });

/** Renders inside a language, as the app does. */
function render(locale: string, catalog: Record<string, string>, node: React.ReactNode): string {
  return renderToStaticMarkup(
    <LocaleContext value={locale as "ja"}>
      <IntlProvider locale={locale} messages={{ ...en, ...catalog }}>
        {node}
      </IntlProvider>
    </LocaleContext>,
  );
}
const words = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** The terms each lesson's own text (prose, diagrams, and its quiz) must use. */
const TERMS: Record<number, string[]> = {
  1: ["pot", "stack", "fold", "showdown", "blinds", "allIn", "flop", "turn", "river", "preflop"],
  2: ["holeCards", "board", "nuts", "pocketPair", "suited", "flush", "threeOfAKind"],
  3: ["royalFlush", "straightFlush", "fullHouse", "straight", "flush", "highCard", "twoPair"],
  4: ["dealerButton", "button", "smallBlindSeat", "bigBlindSeat", "position", "inPosition", "option", "headsUp"],
  5: ["fold", "check", "call", "raiseTo", "raiseBy", "noLimit", "allIn", "bluff"],
  6: ["allIn", "sidePot", "headsUp", "showdown"],
  7: ["kicker", "muck", "showdown", "splitPot"],
  8: ["headsUp", "blinds", "button", "showdown"],
  9: ["ev", "potOdds", "breakEven", "outs", "impliedOdds"],
  10: ["gamblersFallacy", "premiumHand"],
  11: ["bluff", "gameTheory", "mixedStrategy", "breakEven"],
  12: ["sunkCost", "pot"],
  13: ["resulting", "allIn"],
  14: ["bankroll", "kelly", "potOdds"],
  15: ["utg", "cutoff", "hijack", "button", "position", "valueBet", "bluff"],
  16: ["sidePot", "mainPot", "splitPot", "allIn"],
};

describe("translated lessons", () => {
  for (const { locale, lang, catalog, quiz } of LANGS) {
    it(`${locale}: every lesson and quiz question is translated`, () => {
      for (const n of LESSONS) {
        expect(lessonContent(n, locale)?.translated, `lesson ${n}`).toBe(true);
        for (const q of QUIZZES[n]) expect(quiz[q.id], q.id).toBeDefined();
      }
    });

    it(`${locale}: every guided hand has its title, ending, and each coach line, with the same cards and numbers`, async () => {
      const text = await guidedText(locale);
      // The same cards, and every number the English uses (translations may also write "nines" as 9).
      const cards = (s: string) => [...s.matchAll(/\{[2-9TJQKA][shdc]\}/g)].map((m) => m[0]).sort();
      const numbers = (s: string) => new Set([...s.matchAll(/\d+/g)].map((m) => m[0]));
      const same = (translated: string, english: string, what: string) => {
        expect(cards(translated), what).toEqual(cards(english));
        for (const n of numbers(english)) expect(numbers(translated).has(n), `${what}: ${n}`).toBe(true);
      };
      for (const hand of GUIDED_HANDS) {
        const words = text[hand.id];
        expect(words.title, `hand ${hand.id}`).toBeTruthy();
        const coached = hand.script.flatMap((step, i) => (step.coach ? [String(i)] : []));
        expect(Object.keys(words.coach).sort(), `hand ${hand.id}`).toEqual(coached.sort());
        for (const i of coached) same(words.coach[Number(i)], hand.script[Number(i)].coach!, `hand ${hand.id} step ${i}`);
        same(words.ending, hand.ending, `hand ${hand.id} ending`);
      }
    });

    for (const n of LESSONS) {
      it(`${locale} lesson ${n} uses the glossary's terms in its own text`, async () => {
        if (n === 8) await guidedText(locale);
        const Lesson = modules[`../learn/content/${locale}/lesson${n}.tsx`][`Lesson${n}`];
        const text = words(render(locale, catalog, <Lesson />)) + JSON.stringify(QUIZZES[n].map((q) => quiz[q.id]));
        for (const id of TERMS[n]) expect(text, `${locale} lesson ${n}: ${id}`).toContain(term(id)[lang]);
      });
    }

    it(`${locale}: the best-five diagram puts the right cards in each sentence`, () => {
      const html = render(locale, catalog, <BestFiveRows />);
      const results = [...html.matchAll(/<span class="best5-result">(.*?)<\/span><\/div>/g)].map((m) => m[1]);
      const labels = (part: string) => [...part.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
      expect(results.map(labels)).toEqual([["5c", "5d", "5h"], ["Ah", "3c"], ["3c", "2d"]].map((cs) => cs.map((c) => cardName(c, locale))));
    });

    it(`${locale}: the seat map names the right seats, in order, in all four states`, () => {
      for (const players of [2, 6] as const) {
        for (const street of ["preflop", "postflop"] as const) {
          const html = render(locale, catalog, <SeatMap initialPlayers={players} initialStreet={street} />);
          const layout = SEAT_LAYOUTS.find((l) => l.players === players)!;
          const id = (label: string): MessageId =>
            label === "Button (small blind)" ? "seatName.BTNSB" : (`seatName.${{ Button: "BTN", "Small blind": "SB", "Big blind": "BB", "Under the gun": "UTG", Hijack: "HJ", Cutoff: "CO" }[label]}` as MessageId);
          const names = layout[street].map((seat) => catalog[id(layout.labels[seat])]!);
          const title = html.match(/<title[^>]*>(.*?)<\/title>/)![1];
          const players6 = catalog["seatMap.six"]!;
          const pre = catalog["seatMap.preflop"]!;
          expect(title.startsWith(players === 6 ? players6 : catalog["seatMap.headsUp"]!), `${players} ${street}: ${title}`).toBe(true);
          expect(title.includes(street === "preflop" ? pre : catalog["seatMap.postflop"]!), `${players} ${street}: ${title}`).toBe(true);
          // Every seat appears, in the order of play.
          const at = names.map((name) => title.indexOf(name));
          expect(at.every((i, k) => i >= 0 && (k === 0 || i > at[k - 1])), `${players} ${street}: ${title}`).toBe(true);
        }
      }
    });
  }
});
