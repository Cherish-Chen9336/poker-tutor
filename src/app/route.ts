// Hash-based URLs (e.g. "#/learn/3") work on GitHub Pages without server
// routing: a refresh or a bookmark always loads index.html.
import { useSyncExternalStore } from "react";
import { isLocale, type Locale } from "../i18n/locales";

export type Route =
  | { area: "learn"; lesson: number | null }
  | { area: "play" }
  | { area: "review" };

/** Reads a location hash. Anything unknown goes to the lesson list. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "play" && parts.length === 1) return { area: "play" };
  if (parts[0] === "review" && parts.length === 1) return { area: "review" };
  if (parts[0] === "learn" && parts.length === 2 && /^[1-9]\d*$/.test(parts[1])) {
    return { area: "learn", lesson: Number(parts[1]) };
  }
  return { area: "learn", lesson: null };
}

/**
 * Reads a location hash with an optional language in front ("#/zh-Hans/learn/3").
 * No language, or "en", means English, so every older link keeps working.
 */
export function parseLocation(hash: string): { locale: Locale; route: Route } {
  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts[0] && isLocale(parts[0])) return { locale: parts[0], route: parseRoute(`#/${parts.slice(1).join("/")}`) };
  return { locale: "en", route: parseRoute(hash) };
}

/**
 * The link for a page. English links have no language part, so they open in the learner's saved language,
 * unless `named` is set (the language switch's links always name their language).
 */
export function routeHref(route: Route, locale: Locale = "en", named = false): string {
  const path = route.area === "learn" ? (route.lesson === null ? "learn" : `learn/${route.lesson}`) : route.area;
  return locale === "en" && !named ? `#/${path}` : `#/${locale}/${path}`;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** The current location hash, updated when it changes. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash);
}
