// Which language to open in. A link that names a language always wins. A link
// without one (the plain site, or an older English link) opens in the language
// the learner last picked with the switch, or on a first visit, the browser's.
import { parseLocation, routeHref } from "../app/route";
import { isLocale, type Locale } from "./locales";

const KEY = "poker-tutor:language";

/** The first browser language the app has. Traditional Chinese isn't Simplified Chinese, so it's skipped. */
export function browserLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const [lang, ...rest] = tag.toLowerCase().split("-");
    if (lang === "en") return "en";
    if (lang === "ja") return "ja";
    if (lang === "zh") {
      // A named script decides. Without one, Taiwan, Hong Kong, and Macau mean Traditional; plain "zh",
      // mainland, and Singapore Chinese mean Simplified.
      if (rest.includes("hans")) return "zh-Hans";
      if (rest.includes("hant") || rest.some((part) => ["tw", "hk", "mo"].includes(part))) continue;
      return "zh-Hans";
    }
  }
  return "en";
}

/** The language picked with the switch, if any. */
export function savedLocale(storage: Storage | null): Locale | null {
  try {
    const value = storage?.getItem(KEY);
    return value && isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remembers the language picked with the switch. Returns false if the browser won't save it. */
export function saveLocale(storage: Storage | null, locale: Locale): boolean {
  if (!storage) return false;
  try {
    storage.setItem(KEY, locale);
    return true;
  } catch {
    return false;
  }
}

/**
 * The address to open instead, when a link names no language and the learner's language isn't English;
 * otherwise null (stay where you are).
 */
export function startHash(hash: string, storage: Storage | null, languages: readonly string[]): string | null {
  const named = hash.replace(/^#\/?/, "").split("/")[0];
  if (named && isLocale(named)) return null;
  const locale = savedLocale(storage) ?? browserLocale(languages);
  return locale === "en" ? null : routeHref(parseLocation(hash).route, locale);
}

/** A plain left click switches this tab; with a modifier key the browser opens the link elsewhere. */
export function switchesThisTab(e: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; altKey: boolean }): boolean {
  return e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
}

/** At startup: opens a link that names no language in the learner's language, replacing the address so Back skips it. */
export function openInLearnerLanguage(win: Window = window): void {
  const start = startHash(win.location.hash, browserStorage(win), win.navigator.languages ?? [win.navigator.language]);
  if (start) win.history.replaceState(null, "", start);
}

export function browserStorage(win: Window = window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}
