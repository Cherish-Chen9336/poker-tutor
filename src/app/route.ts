// Hash-based URLs (e.g. "#/learn/3") work on GitHub Pages without server
// routing: a refresh or a bookmark always loads index.html.
import { useSyncExternalStore } from "react";

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

export function routeHref(route: Route): string {
  if (route.area === "learn") return route.lesson === null ? "#/learn" : `#/learn/${route.lesson}`;
  return `#/${route.area}`;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/** The current location hash, updated when it changes. */
export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash);
}
