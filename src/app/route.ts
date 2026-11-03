// Hash-based URLs (e.g. "#/learn/3") work on GitHub Pages without server
// routing: a refresh or a bookmark always loads index.html.
import { useEffect, useState, useTransition } from "react";
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

/**
 * The current location hash, and whether the app is moving to a new one. Each change is a transition: the page on
 * screen stays until the next page, its language, and its code have all loaded, so there's no loading flash between
 * steps. (A plain store subscription can't be a transition; React would swap the page for the loading screen.)
 */
export function useHash(): [hash: string, navigating: boolean] {
  const [hash, setHash] = useState(() => window.location.hash);
  const [navigating, startNavigation] = useTransition();
  useEffect(() => {
    const onChange = () => startNavigation(() => setHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    // Catches a change between the first render and now.
    if (window.location.hash !== hash) onChange();
    return () => window.removeEventListener("hashchange", onChange);
    // Subscribes once; the check above only needs the first render's hash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [hash, navigating];
}
