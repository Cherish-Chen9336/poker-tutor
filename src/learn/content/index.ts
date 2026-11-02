import { lazy, type ComponentType } from "react";
import type { Locale } from "../../i18n/locales";
import { Lesson1, Lesson2, Lesson3, Lesson4, Lesson5, Lesson6, Lesson7 } from "./rules-lessons";

// Lessons 8 and 10 use the full game engine, which is large, so lessons 8–14
// load only when opened. LessonPage shows them inside a Suspense boundary.
const thinking = () => import("./thinking-lessons");
const afterPlay = () => import("./after-play-lessons");
const bigTable = () => import("./table-lessons");

/** Lesson text by lesson id. */
export const LESSON_CONTENT: Record<number, ComponentType> = {
  1: Lesson1,
  2: Lesson2,
  3: Lesson3,
  4: Lesson4,
  5: Lesson5,
  6: Lesson6,
  7: Lesson7,
  8: lazy(() => thinking().then((m) => ({ default: m.Lesson8 }))),
  9: lazy(() => thinking().then((m) => ({ default: m.Lesson9 }))),
  10: lazy(() => thinking().then((m) => ({ default: m.Lesson10 }))),
  11: lazy(() => afterPlay().then((m) => ({ default: m.Lesson11 }))),
  12: lazy(() => afterPlay().then((m) => ({ default: m.Lesson12 }))),
  13: lazy(() => afterPlay().then((m) => ({ default: m.Lesson13 }))),
  14: lazy(() => afterPlay().then((m) => ({ default: m.Lesson14 }))),
  15: lazy(() => bigTable().then((m) => ({ default: m.Lesson15 }))),
  16: lazy(() => bigTable().then((m) => ({ default: m.Lesson16 }))),
};

/** Translated lesson text, loaded only for its language. */
const TRANSLATED: Record<Exclude<Locale, "en">, Record<number, ComponentType>> = {
  "zh-Hans": {
    1: lazy(() => import("./zh-Hans/lesson1").then((m) => ({ default: m.Lesson1 }))),
    2: lazy(() => import("./zh-Hans/lesson2").then((m) => ({ default: m.Lesson2 }))),
    3: lazy(() => import("./zh-Hans/lesson3").then((m) => ({ default: m.Lesson3 }))),
    4: lazy(() => import("./zh-Hans/lesson4").then((m) => ({ default: m.Lesson4 }))),
    5: lazy(() => import("./zh-Hans/lesson5").then((m) => ({ default: m.Lesson5 }))),
    6: lazy(() => import("./zh-Hans/lesson6").then((m) => ({ default: m.Lesson6 }))),
    7: lazy(() => import("./zh-Hans/lesson7").then((m) => ({ default: m.Lesson7 }))),
    9: lazy(() => import("./zh-Hans/lesson9").then((m) => ({ default: m.Lesson9 }))),
    10: lazy(() => import("./zh-Hans/lesson10").then((m) => ({ default: m.Lesson10 }))),
    11: lazy(() => import("./zh-Hans/lesson11").then((m) => ({ default: m.Lesson11 }))),
    12: lazy(() => import("./zh-Hans/lesson12").then((m) => ({ default: m.Lesson12 }))),
    13: lazy(() => import("./zh-Hans/lesson13").then((m) => ({ default: m.Lesson13 }))),
    14: lazy(() => import("./zh-Hans/lesson14").then((m) => ({ default: m.Lesson14 }))),
    15: lazy(() => import("./zh-Hans/lesson15").then((m) => ({ default: m.Lesson15 }))),
    16: lazy(() => import("./zh-Hans/lesson16").then((m) => ({ default: m.Lesson16 }))),
  },
  ja: {
    1: lazy(() => import("./ja/lesson1").then((m) => ({ default: m.Lesson1 }))),
    2: lazy(() => import("./ja/lesson2").then((m) => ({ default: m.Lesson2 }))),
    3: lazy(() => import("./ja/lesson3").then((m) => ({ default: m.Lesson3 }))),
    4: lazy(() => import("./ja/lesson4").then((m) => ({ default: m.Lesson4 }))),
    5: lazy(() => import("./ja/lesson5").then((m) => ({ default: m.Lesson5 }))),
    6: lazy(() => import("./ja/lesson6").then((m) => ({ default: m.Lesson6 }))),
    7: lazy(() => import("./ja/lesson7").then((m) => ({ default: m.Lesson7 }))),
    9: lazy(() => import("./ja/lesson9").then((m) => ({ default: m.Lesson9 }))),
    10: lazy(() => import("./ja/lesson10").then((m) => ({ default: m.Lesson10 }))),
    11: lazy(() => import("./ja/lesson11").then((m) => ({ default: m.Lesson11 }))),
    12: lazy(() => import("./ja/lesson12").then((m) => ({ default: m.Lesson12 }))),
    13: lazy(() => import("./ja/lesson13").then((m) => ({ default: m.Lesson13 }))),
    14: lazy(() => import("./ja/lesson14").then((m) => ({ default: m.Lesson14 }))),
    15: lazy(() => import("./ja/lesson15").then((m) => ({ default: m.Lesson15 }))),
    16: lazy(() => import("./ja/lesson16").then((m) => ({ default: m.Lesson16 }))),
  },
};

/** A lesson's text in the page's language, or the English one (marked untranslated) if there's none yet. */
export function lessonContent(id: number, locale: Locale): { Component: ComponentType; translated: boolean } | null {
  const translated = locale === "en" ? undefined : TRANSLATED[locale][id];
  if (translated) return { Component: translated, translated: true };
  const english = LESSON_CONTENT[id];
  return english ? { Component: english, translated: locale === "en" } : null;
}
