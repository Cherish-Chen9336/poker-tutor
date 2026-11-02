// The app's languages. English is the source; the others are machine-assisted
// translations (Claude translates, Codex cross-checks; no human review).

export const LOCALES = ["en", "zh-Hans", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

/** Each language's own name, for the language switch. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", "zh-Hans": "简体中文", ja: "日本語" };

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
