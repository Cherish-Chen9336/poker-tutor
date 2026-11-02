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
import { QUIZ_TEXT } from "../learn/quizzes-i18n";
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
  function view(button: number, folded: number[]): TableView {
    return {
      viewerSeat: 0, handNumber: 1, street: "preflop", board: [], pots: [],
      seats: Array.from({ length: 6 }, (_, seat) => ({
        seat, id: `p${seat}`, name: `P${seat}`, stack: 190, betThisStreet: 0,
        status: folded.includes(seat) ? ("folded" as const) : ("active" as const), cards: seat === 0 ? ["Ah", "Kd"] : null,
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
      "你在关煞位（CO）。翻牌前，下注从枪口位开始，依次轮到大盲位；有人加注时，其他人都会再轮到一次。翻牌后，如果仍在局中的玩家都继续，你在 4 人中第 3 个行动，排在SB和BB之后。",
    );
    expect(phraseFact(createIntl({ locale: "ja", messages: { ...en, ...ja } }), fact)).toMatch(
      /^あなたはカットオフ（CO）です。.*残っている全員が続ければ、4人中3番目に、SB.*BBの後でアクションします。$/,
    );
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
        expect(cards([text.prompt, ...text.choices, text.why].join(" ")), id).toEqual(cards([q!.prompt, ...q!.choices, q!.why].join(" ")));
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
