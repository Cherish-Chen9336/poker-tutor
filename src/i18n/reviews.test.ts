// Keeps review records honest: a "passed" record must match the current
// English and translation exactly, so changing either one requires a new check.
import { describe, expect, it } from "vitest";
import lessonsDoc from "../../docs/lessons.md?raw";
import coachSource from "../game/coach.ts?raw";
import cardNamesSource from "../learn/card-names.ts?raw";
import rulesLessons from "../learn/content/rules-lessons.tsx?raw";
import jaLesson1 from "../learn/content/ja/lesson1.tsx?raw";
import coachTextSource from "./coach-text.tsx?raw";
import zhLesson1 from "../learn/content/zh-Hans/lesson1.tsx?raw";
import { text as jaQuiz } from "../learn/quiz-text/ja";
import { text as zhQuiz } from "../learn/quiz-text/zh-Hans";
import { QUIZZES } from "../learn/quizzes";
import { GLOSSARY, GLOSSARY_VERSION } from "./glossary";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";
import { REVIEWS, type ReviewRecord } from "./reviews";

/** A short, stable fingerprint of some text (FNV-1a, 64-bit). */
function fingerprint(text: string): string {
  let h = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(text)) h = BigInt.asUintN(64, (h ^ BigInt(byte)) * 0x100000001b3n);
  return h.toString(16).padStart(16, "0");
}

const lesson1Doc = lessonsDoc.slice(lessonsDoc.indexOf("## Lesson 1:"), lessonsDoc.indexOf("## Lesson 2:"));
const lesson1Page = rulesLessons.slice(rulesLessons.indexOf("export function Lesson1()"), rulesLessons.indexOf("export function Lesson2()"));

/** Everything a review checked, by name, so a test can show that changing any one of them invalidates it. */
type Inputs = Record<string, string>;
function inputs(): Inputs {
  const keys = Object.keys(en).sort() as (keyof typeof en)[];
  return {
    enMessages: JSON.stringify(keys.map((k) => [k, en[k]])),
    zhMessages: JSON.stringify(keys.map((k) => [k, zhHans[k]])),
    jaMessages: JSON.stringify(keys.map((k) => [k, ja[k]])),
    glossary: JSON.stringify(GLOSSARY),
    cardNames: cardNamesSource,
    coach: coachSource,
    coachText: coachTextSource,
    lesson1Doc,
    lesson1Page,
    lesson1Quiz: JSON.stringify(QUIZZES[1]),
    zhLesson1: zhLesson1 + JSON.stringify(QUIZZES[1].map((q) => zhQuiz[q.id])),
    jaLesson1: jaLesson1 + JSON.stringify(QUIZZES[1].map((q) => jaQuiz[q.id])),
  };
}
/** Which inputs are the English source and which the translation, for each unit. Shared code counts on both sides. */
const SCOPE: Record<string, (locale: ReviewRecord["locale"]) => { source: string[]; translation: string[] }> = {
  messages: (locale) => ({
    source: ["enMessages", "glossary", "coach", "coachText"],
    translation: [locale === "ja" ? "jaMessages" : "zhMessages", "glossary", "cardNames", "coachText"],
  }),
  lesson1: (locale) => ({
    source: ["lesson1Doc", "lesson1Page", "lesson1Quiz", "glossary"],
    translation: [locale === "ja" ? "jaLesson1" : "zhLesson1", "glossary"],
  }),
};
function fingerprints(record: ReviewRecord, all: Inputs) {
  const scope = SCOPE[record.unit](record.locale);
  const join = (names: string[]) => names.map((n) => `${n}\n${all[n]}`).join("\n---\n");
  return { source: fingerprint(join(scope.source)), translation: fingerprint(join(scope.translation)), glossaryVersion: GLOSSARY_VERSION };
}

describe("translation review records", () => {
  it("cover every translated unit", () => {
    const units = REVIEWS.map((r) => `${r.unit}/${r.locale}`).sort();
    expect(units).toEqual(["lesson1/ja", "lesson1/zh-Hans", "messages/ja", "messages/zh-Hans"]);
  });

  for (const record of REVIEWS) {
    it(`${record.unit} (${record.locale}): a passed review still matches what's shipped`, () => {
      const current = fingerprints(record, inputs());
      if (record.status === "passed") {
        expect(
          { source: record.source, translation: record.translation, glossaryVersion: record.glossaryVersion },
          `Stale review for ${record.unit}/${record.locale}: re-check it, then record ${JSON.stringify(current)}`,
        ).toEqual(current);
      } else {
        console.info(`${record.unit}/${record.locale} is pending; current fingerprints: ${JSON.stringify(current)}`);
      }
    });
  }

  it("changing anything a review covered invalidates it", () => {
    const base = inputs();
    for (const record of REVIEWS) {
      const before = fingerprints(record, base);
      const scope = SCOPE[record.unit](record.locale);
      for (const name of new Set([...scope.source, ...scope.translation])) {
        const after = fingerprints(record, { ...base, [name]: base[name] + " " });
        expect(after, `${record.unit}/${record.locale}: ${name}`).not.toEqual(before);
      }
    }
  });
});
