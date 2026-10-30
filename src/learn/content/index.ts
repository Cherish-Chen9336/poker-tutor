import type { ReactNode } from "react";
import { Lesson1, Lesson2, Lesson3, Lesson4, Lesson5, Lesson6, Lesson7 } from "./rules-lessons";

/** Lesson text by lesson id. Lessons without an entry are still being built. */
export const LESSON_CONTENT: Record<number, () => ReactNode> = {
  1: Lesson1,
  2: Lesson2,
  3: Lesson3,
  4: Lesson4,
  5: Lesson5,
  6: Lesson6,
  7: Lesson7,
};
