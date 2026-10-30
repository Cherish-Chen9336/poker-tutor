import { lazy, type ComponentType } from "react";
import { Lesson1, Lesson2, Lesson3, Lesson4, Lesson5, Lesson6, Lesson7 } from "./rules-lessons";

// Lessons 8 and 10 use the full game engine, which is large, so lessons 8–14
// load only when opened. LessonPage shows them inside a Suspense boundary.
const thinking = () => import("./thinking-lessons");
const afterPlay = () => import("./after-play-lessons");

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
};
