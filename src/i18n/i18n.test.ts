// Checks that keep translations honest (pilot). They can't prove a translation
// means the same; Codex's sentence-by-sentence review does that (docs/translation.md).
import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";
import jaLesson1 from "../learn/content/ja/lesson1.tsx?raw";
import zhLesson1 from "../learn/content/zh-Hans/lesson1.tsx?raw";
import { createIntl } from "react-intl";
import { describe, expect, it } from "vitest";
import { coachLines } from "../game/coach";
import type { TableView } from "../game/types";
import { cardName } from "../learn/card-names";
import { QUIZZES } from "../learn/quizzes";
import { text as jaQuiz } from "../learn/quiz-text/ja";
import { text as zhQuiz } from "../learn/quiz-text/zh-Hans";

const QUIZ_TEXT = { "zh-Hans": zhQuiz, ja: jaQuiz };
import { phraseFact } from "./coach-text";
import { GLOSSARY, term } from "./glossary";
import { en, type MessageId } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const CATALOGS = { "zh-Hans": zhHans, ja };
/** The values and tags a message uses, found by the ICU parser (select options aren't values). */
function names(text: string): { values: string[]; tags: string[] } {
  const values = new Set<string>();
  const tagNames = new Set<string>();
  const walk = (els: MessageFormatElement[]) => {
    for (const el of els) {
      if (el.type === TYPE.tag) {
        tagNames.add(el.value);
        walk(el.children);
      } else if (el.type !== TYPE.literal && el.type !== TYPE.pound) {
        values.add(el.value);
        if (el.type === TYPE.select || el.type === TYPE.plural) for (const option of Object.values(el.options)) walk(option.value);
      }
    }
  };
  walk(parse(text));
  return { values: [...values].sort(), tags: [...tagNames].sort() };
}

describe("interface text", () => {
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    it(`${locale} has every message, with the same values and tags as English`, () => {
      for (const id of Object.keys(en) as MessageId[]) {
        const text = catalog[id];
        expect(text, `${locale} ${id}`).toBeTruthy();
        expect(names(text!), `${locale} ${id}`).toEqual(names(en[id]));
      }
      expect(Object.keys(catalog).filter((id) => !(id in en))).toEqual([]);
    });
  }
});

describe("the coach's position line, built from facts", () => {
  function view(button: number, folded: number[], allIn: number[] = []): TableView {
    return {
      viewerSeat: 0, handNumber: 1, street: "preflop", board: [], pots: [],
      seats: Array.from({ length: 6 }, (_, seat) => ({
        seat, id: `p${seat}`, name: `P${seat}`, stack: allIn.includes(seat) ? 0 : 190, betThisStreet: allIn.includes(seat) ? 10 : 0,
        status: folded.includes(seat) ? ("folded" as const) : allIn.includes(seat) ? ("all-in" as const) : ("active" as const),
        cards: seat === 0 ? ["Ah", "Kd"] : null,
      })),
      buttonSeat: button, bigBlindSeat: (button + 2) % 6, smallBlind: 1, bigBlind: 2, actionTo: 0, handOver: false, winners: null,
    };
  }
  // Every button seat, with every combination of other seats folded.
  const views: TableView[] = [];
  for (let button = 0; button < 6; button++) {
    for (let mask = 0; mask < 32; mask++) views.push(view(button, [1, 2, 3, 4, 5].filter((_, i) => mask & (1 << i))));
  }

  it("says exactly what the English coach says, in every seat situation", () => {
    const intl = createIntl({ locale: "en", messages: en });
    let checked = 0;
    for (const v of views) {
      const line = coachLines(v).find((l) => l.fact);
      if (!line) continue;
      expect(phraseFact(intl, line.fact!)).toBe(line.text);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("phrases the same facts in Chinese and Japanese", () => {
    const fact = coachLines(view(1, [4, 5])).find((l) => l.fact)!.fact!; // the cutoff, after the SB and the BB
    expect(phraseFact(createIntl({ locale: "zh-Hans", messages: { ...en, ...zhHans } }), fact)).toBe(
      "你在关煞位（CO）。翻牌前从枪口位开始，依次轮到大盲位，跳过无法行动的玩家；加注后，其他仍能行动的玩家会再有一次行动机会。翻牌后，如果现在能下注的 4 人到时都能下注，你第 3 个行动，排在小盲位和大盲位之后。",
    );
    expect(phraseFact(createIntl({ locale: "ja", messages: { ...en, ...ja } }), fact)).toMatch(
      /^あなたはカットオフ（CO）です。.*今ベットできる4人全員がその時もベットできれば、スモールブラインドとビッグブラインドの後で3番目にアクションします。$/,
    );
  });
});

describe("the coach's position line with players all-in", () => {
  const intls = {
    en: createIntl({ locale: "en", messages: en }),
    "zh-Hans": createIntl({ locale: "zh-Hans", messages: { ...en, ...zhHans } }),
    ja: createIntl({ locale: "ja", messages: { ...en, ...ja } }),
  };
  function view(button: number, folded: number[], allIn: number[]): TableView {
    return {
      viewerSeat: 0, handNumber: 1, street: "preflop", board: [], pots: [],
      seats: Array.from({ length: 6 }, (_, seat) => ({
        seat, id: `p${seat}`, name: `P${seat}`, stack: allIn.includes(seat) ? 0 : 190, betThisStreet: allIn.includes(seat) ? 10 : 0,
        status: folded.includes(seat) ? ("folded" as const) : allIn.includes(seat) ? ("all-in" as const) : ("active" as const),
        cards: seat === 0 ? ["Ah", "Kd"] : null,
      })),
      buttonSeat: button, bigBlindSeat: (button + 2) % 6, smallBlind: 1, bigBlind: 2, actionTo: 0, handOver: false, winners: null,
    };
  }
  const say = (v: TableView) => {
    const line = coachLines(v).find((l) => l.fact)!;
    return { en: line.text, fact: line.fact!, zh: phraseFact(intls["zh-Hans"], line.fact!), ja: phraseFact(intls.ja, line.fact!) };
  };

  it("leaves all-in players out of the count, in every language", () => {
    // Under the gun (button in seat 3); the big blind (seat 5) is all-in, so 5 players can still bet.
    const s = say(view(3, [], [5]));
    expect([s.fact.rank, s.fact.count, s.fact.before]).toEqual([2, 5, ["SB"]]);
    expect(s.en).toMatch(/if all 5 players who can bet now still can, you act second, after the SB\.$/);
    expect(s.zh).toMatch(/如果现在能下注的 5 人到时都能下注，你第 2 个行动，排在小盲位之后。$/);
    expect(s.ja).toMatch(/今ベットできる5人全員がその時もベットできれば、スモールブラインドの後で2番目にアクションします。$/);
  });

  it("after the blinds go all-in, under the gun acts first of the 4 who can still bet (Codex's table case)", () => {
    const s = say(view(3, [], [4, 5]));
    expect([s.fact.rank, s.fact.count]).toEqual([1, 4]);
    expect(s.en).toMatch(/After the flop, if all 4 players who can bet now still can, you act first\.$/);
    expect(s.zh).toMatch(/如果现在能下注的 4 人到时都能下注，你第一个行动。$/);
  });

  it("says when nobody else can bet any more", () => {
    // Everyone else is all-in: staying in ends the betting.
    const s = say(view(3, [], [1, 2, 3, 4, 5]));
    expect(s.fact.count).toBe(1);
    expect(s.en).toMatch(/if you stay in, nobody can bet after this round: the remaining cards are dealt out\.$/);
    expect(s.zh).toMatch(/本轮后没人能再下注，剩余公共牌直接发完。$/);
    expect(s.ja).toMatch(/このラウンド後は誰もベットできず、残りの共有カードがそのまま配られます。$/);
  });

  it("names one to four earlier seats, in order, in every language", () => {
    // The button (seat 0) acts after up to five others; fold some to get each list length.
    for (const [folded, count] of [[[1, 2, 3, 4], 1], [[2, 3, 4], 2], [[3, 4], 3], [[4], 4], [[], 5]] as [number[], number][]) {
      const s = say(view(0, folded, []));
      expect(s.fact.before.length).toBe(count);
      expect(s.en).toContain("you act last on every later round");
      expect(s.zh).toContain("你每一轮都最后行动");
    }
    // Under the gun with the SB and BB still in: two names, joined the way each language does it.
    const two = say(view(3, [], []));
    expect(two.en).toContain("after the SB and the BB");
    expect(two.zh).toContain("排在小盲位和大盲位之后");
    expect(two.ja).toContain("スモールブラインドとビッグブラインドの後");
    // The cutoff with UTG and HJ in too: four names before it.
    const four = say(view(1, [], []));
    expect(four.fact.before).toEqual(["SB", "BB", "UTG", "HJ"]);
    expect(four.en).toContain("after the SB, the BB, the UTG, and the HJ");
    expect(four.zh).toContain("小盲位、大盲位、枪口位和劫位");
  });
});

describe("quiz translations", () => {
  const cards = (text: string) => [...text.matchAll(/\{[2-9TJQKA][shdc]\}/g)].map((m) => m[0]).sort();
  for (const [locale, texts] of Object.entries(QUIZ_TEXT)) {
    it(`${locale}: same questions, the same number of choices, and the same cards`, () => {
      const all = Object.values(QUIZZES).flat();
      for (const [id, text] of Object.entries(texts)) {
        const q = all.find((x) => x.id === id);
        expect(q, id).toBeDefined();
        expect(text.choices.length, id).toBe(q!.choices.length);
        // Cards match field by field, and a choice that's only numbers or cards must be identical to the English.
        expect(cards(text.prompt), `${id} prompt`).toEqual(cards(q!.prompt));
        expect(cards(text.why), `${id} why`).toEqual(cards(q!.why));
        text.choices.forEach((choice, i) => {
          expect(cards(choice), `${id} choice ${i}`).toEqual(cards(q!.choices[i]));
          if (!/[A-Za-z]/.test(q!.choices[i].replace(/\{[2-9TJQKA][shdc]\}/g, ""))) expect(choice, `${id} choice ${i}`).toBe(q!.choices[i]);
        });
      }
    });
  }
});

describe("glossary", () => {
  it("has one entry per concept and no empty terms", () => {
    const ids = GLOSSARY.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of GLOSSARY) expect([t.en, t.zh, t.ja].every(Boolean), t.id).toBe(true);
  });

  const pages: [string, "zh" | "ja", string][] = [
    ["zh-Hans lesson 1", "zh", zhLesson1 + JSON.stringify(QUIZ_TEXT["zh-Hans"]) + JSON.stringify(zhHans)],
    ["ja lesson 1", "ja", jaLesson1 + JSON.stringify(QUIZ_TEXT.ja) + JSON.stringify(ja)],
  ];
  for (const [name, lang, text] of pages) {
    it(`${name} uses the glossary's terms`, () => {
      for (const id of ["pot", "stack", "fold", "showdown", "blinds", "allIn", "flop", "turn", "river", "preflop"]) {
        expect(text, `${name}: ${id}`).toContain(term(id)[lang]);
      }
      for (const t of GLOSSARY) for (const bad of t.avoid?.[lang] ?? []) expect(text, `${name} avoids ${bad}`).not.toContain(bad);
    });
  }
});

describe("card names", () => {
  const deck = [..."23456789TJQKA"].flatMap((r) => [..."shdc"].map((s) => r + s));
  it("names all 52 cards differently in each language", () => {
    for (const locale of ["en", "zh-Hans", "ja"] as const) expect(new Set(deck.map((c) => cardName(c, locale))).size).toBe(52);
    expect([cardName("Ah", "zh-Hans"), cardName("Ts", "zh-Hans"), cardName("Ah", "ja"), cardName("Ts", "ja")]).toEqual(["红桃A", "黑桃10", "ハートのエース", "スペードの10"]);
  });
});
