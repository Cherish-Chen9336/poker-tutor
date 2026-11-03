// Keeps review records honest: a "passed" record must match the current
// English and translation exactly, so changing either one requires a new check.
import { describe, expect, it } from "vitest";
import lessonsDoc from "../../docs/lessons.md?raw";
import coachSource from "../game/coach.ts?raw";
import handsSource from "../game/hands.ts?raw";
import randomSource from "../game/random.ts?raw";
import simulateSource from "../game/simulate.ts?raw";
import cardNamesSource from "../learn/card-names.ts?raw";
import afterPlayLessons from "../learn/content/after-play-lessons.tsx?raw";
import rulesLessons from "../learn/content/rules-lessons.tsx?raw";
import tableLessons from "../learn/content/table-lessons.tsx?raw";
import thinkingLessons from "../learn/content/thinking-lessons.tsx?raw";
import diagramDataSource from "../learn/diagram-data.ts?raw";
import diagramsSource from "../learn/diagrams.tsx?raw";
import thinkingSource from "../learn/thinking.tsx?raw";
import visualsSource from "../learn/visuals.tsx?raw";
import yourHandsSource from "../learn/YourHands.tsx?raw";
import coachTextSource from "./coach-text.tsx?raw";
import { text as jaGuided } from "../learn/guided-text/ja";
import { text as zhGuided } from "../learn/guided-text/zh-Hans";
import guidedHandsSource from "../learn/guided-hands.ts?raw";
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

/** Translated lesson files by language and lesson number. */
const LESSON_FILES = import.meta.glob<string>("../learn/content/{zh-Hans,ja}/lesson*.tsx", { query: "?raw", import: "default", eager: true });
const TRANSLATED_LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
/** Code that decides which interface words the table, Play screen, and hand log show. */
const PLAY_SOURCES = import.meta.glob<string>(
  [
    "../App.tsx",
    "../game/log-facts.ts",
    "../game/hand-log.ts",
    "../game/equity.ts",
    "../game/positions.ts",
    "../game/pot-math.ts",
    "./log-text.ts",
    "../ui/*.ts*",
    "../play/*.ts*",
    "../learn/GuidedHands.tsx",
    "../learn/guided-run.ts",
    "../learn/guided-text.ts",
    "../game/review.ts",
    "../game/hand-read.ts",
    "./review-text.ts",
    "../review/*.tsx",
    "!../**/*.test.*",
  ],
  { query: "?raw", import: "default", eager: true },
);
/** The English lesson components, one after another. */
const ENGLISH_LESSONS = [rulesLessons, thinkingLessons, afterPlayLessons, tableLessons].join("\n");
const lessonFile = (locale: string, n: number) => LESSON_FILES[`../learn/content/${locale}/lesson${n}.tsx`];
/** The text from `from` up to `to`, or to the end when `to` isn't there. */
const between = (text: string, from: string, to: string) => {
  const end = text.indexOf(to, text.indexOf(from) + 1);
  return text.slice(text.indexOf(from), end < 0 ? undefined : end);
};

/** Everything a review checked, by name, so a test can show that changing any one of them invalidates it. */
type Inputs = Record<string, string>;
function inputs(): Inputs {
  const keys = Object.keys(en).sort() as (keyof typeof en)[];
  const all: Inputs = {
    enMessages: JSON.stringify(keys.map((k) => [k, en[k]])),
    zhMessages: JSON.stringify(keys.map((k) => [k, zhHans[k]])),
    jaMessages: JSON.stringify(keys.map((k) => [k, ja[k]])),
    glossary: JSON.stringify(GLOSSARY),
    cardNames: cardNamesSource,
    coach: coachSource,
    coachText: coachTextSource,
    diagrams: diagramsSource + visualsSource + thinkingSource + yourHandsSource,
    diagramData: diagramDataSource,
    // The calculations behind facts the lessons show: equity, the streak simulation, and its random source.
    facts: handsSource + simulateSource + randomSource,
    // The table, Play screen, and hand log: the code that chooses which words appear.
    // Sorted by path: the file system's listing order differs between machines.
    play: Object.keys(PLAY_SOURCES).sort().map((path) => PLAY_SOURCES[path]).join("\n"),
  };
  for (const n of TRANSLATED_LESSONS) {
    all[`lesson${n}Doc`] = between(lessonsDoc, `## Lesson ${n}:`, `## Lesson ${n + 1}:`);
    all[`lesson${n}Page`] = between(ENGLISH_LESSONS, `export function Lesson${n}()`, "\nexport function ");
    all[`lesson${n}Quiz`] = JSON.stringify(QUIZZES[n]);
    // Lesson 8's guided hands are part of its text: the English scripts and their translations.
    const guided = (text: unknown) => (n === 8 ? JSON.stringify(text) : "");
    if (n === 8) all[`lesson${n}Page`] += guidedHandsSource;
    all[`zhLesson${n}`] = lessonFile("zh-Hans", n) + JSON.stringify(QUIZZES[n].map((q) => zhQuiz[q.id])) + guided(zhGuided);
    all[`jaLesson${n}`] = lessonFile("ja", n) + JSON.stringify(QUIZZES[n].map((q) => jaQuiz[q.id])) + guided(jaGuided);
  }
  return all;
}
/** Which inputs are the English source and which the translation, for each unit. Shared code counts on both sides. */
const SCOPE: Record<string, (locale: ReviewRecord["locale"]) => { source: string[]; translation: string[] }> = {
  messages: (locale) => ({
    source: ["enMessages", "glossary", "coach", "coachText", "diagrams", "diagramData", "facts", "play"],
    translation: [locale === "ja" ? "jaMessages" : "zhMessages", "glossary", "cardNames", "coachText", "diagrams", "diagramData", "facts", "play"],
  }),
};
for (const n of TRANSLATED_LESSONS) {
  SCOPE[`lesson${n}`] = (locale) => ({
    source: [`lesson${n}Doc`, `lesson${n}Page`, `lesson${n}Quiz`, "glossary"],
    translation: [`${locale === "ja" ? "ja" : "zh"}Lesson${n}`, "glossary"],
  });
}
function fingerprints(record: ReviewRecord, all: Inputs) {
  const scope = SCOPE[record.unit](record.locale);
  const join = (names: string[]) => names.map((n) => `${n}\n${all[n]}`).join("\n---\n");
  return { source: fingerprint(join(scope.source)), translation: fingerprint(join(scope.translation)), glossaryVersion: GLOSSARY_VERSION };
}

describe("translation review records", () => {
  it("cover every translated unit", () => {
    const units = REVIEWS.map((r) => `${r.unit}/${r.locale}`).sort();
    const expected = ["messages", ...TRANSLATED_LESSONS.map((n) => `lesson${n}`)].flatMap((u) => [`${u}/ja`, `${u}/zh-Hans`]);
    expect(units).toEqual(expected.sort());
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
