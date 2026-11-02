// Keeps review records honest: a "passed" record must match the current
// English and translation exactly, so changing either one requires a new check.
import { describe, expect, it } from "vitest";
import lessonsDoc from "../../docs/lessons.md?raw";
import jaLesson1 from "../learn/content/ja/lesson1.tsx?raw";
import zhLesson1 from "../learn/content/zh-Hans/lesson1.tsx?raw";
import { text as jaQuiz } from "../learn/quiz-text/ja";
import { text as zhQuiz } from "../learn/quiz-text/zh-Hans";
import { QUIZZES } from "../learn/quizzes";
import { GLOSSARY_VERSION } from "./glossary";
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
const sources: Record<string, (locale: ReviewRecord["locale"]) => { source: string; translation: string }> = {
  messages: (locale) => {
    const catalog = locale === "ja" ? ja : zhHans;
    const keys = Object.keys(en).sort() as (keyof typeof en)[];
    return { source: JSON.stringify(keys.map((k) => [k, en[k]])), translation: JSON.stringify(keys.map((k) => [k, catalog[k]])) };
  },
  lesson1: (locale) => ({
    source: lesson1Doc + JSON.stringify(QUIZZES[1]),
    translation: (locale === "ja" ? jaLesson1 : zhLesson1) + JSON.stringify(QUIZZES[1].map((q) => (locale === "ja" ? jaQuiz : zhQuiz)[q.id])),
  }),
};

describe("translation review records", () => {
  it("cover every translated unit", () => {
    const units = REVIEWS.map((r) => `${r.unit}/${r.locale}`).sort();
    expect(units).toEqual(["lesson1/ja", "lesson1/zh-Hans", "messages/ja", "messages/zh-Hans"]);
  });

  for (const record of REVIEWS) {
    it(`${record.unit} (${record.locale}): a passed review still matches what's shipped`, () => {
      const now = sources[record.unit](record.locale);
      const current = { source: fingerprint(now.source), translation: fingerprint(now.translation), glossaryVersion: GLOSSARY_VERSION };
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
});
