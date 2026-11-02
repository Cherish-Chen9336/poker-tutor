// Quiz wording in other languages, loaded only for the language in use (see quiz-text/).
import type { Locale } from "../i18n/locales";
import type { QuestionText } from "./quiz-text/types";
import type { Question } from "./quizzes";

export type { QuestionText };

const loaders: Record<Exclude<Locale, "en">, () => Promise<Record<string, QuestionText>>> = {
  "zh-Hans": () => import("./quiz-text/zh-Hans").then((m) => m.text),
  ja: () => import("./quiz-text/ja").then((m) => m.text),
};
const loaded = new Map<Locale, Promise<Record<string, QuestionText>>>();

/** A language's quiz wording, loaded once (English needs none). */
export function quizText(locale: Locale): Promise<Record<string, QuestionText>> {
  if (locale === "en") return Promise.resolve({});
  if (!loaded.has(locale)) loaded.set(locale, loaders[locale]());
  return loaded.get(locale)!;
}

/** The question in another language's words, or null when it isn't translated yet. */
export function localizeQuestion(q: Question, locale: Locale, texts: Record<string, QuestionText>): Question | null {
  if (locale === "en") return q;
  const text = texts[q.id];
  return text ? { ...q, ...text } : null;
}
