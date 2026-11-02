// Lesson 8's guided-hand words in other languages, loaded only for the language in use (see guided-text/).
import type { Locale } from "../i18n/locales";
import type { HandText } from "./guided-text/types";

export type GuidedText = Record<number, HandText>;

const loaders: Record<Exclude<Locale, "en">, () => Promise<GuidedText>> = {
  "zh-Hans": () => import("./guided-text/zh-Hans").then((m) => m.text),
  ja: () => import("./guided-text/ja").then((m) => m.text),
};
const loaded = new Map<Locale, Promise<GuidedText>>();

/**
 * A language's guided-hand words, loaded once. Once loaded, the promise is marked
 * fulfilled (React's convention), so `use()` reads it without suspending again.
 */
export function guidedText(locale: Exclude<Locale, "en">): Promise<GuidedText> {
  if (!loaded.has(locale)) {
    const promise = loaders[locale]() as Promise<GuidedText> & { status?: "fulfilled" | "rejected"; value?: GuidedText; reason?: unknown };
    // Both outcomes are handled here, so a failed load reaches the error boundary through use(), never as an unhandled rejection.
    void promise.then(
      (value) => {
        Object.assign(promise, { status: "fulfilled", value });
      },
      (reason: unknown) => {
        Object.assign(promise, { status: "rejected", reason });
      },
    );
    loaded.set(locale, promise);
  }
  return loaded.get(locale)!;
}
