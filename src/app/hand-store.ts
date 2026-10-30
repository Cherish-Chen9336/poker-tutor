// Played hands, saved in this browser for the Review screen. At most 50 hands
// and about 2 MiB; the oldest are dropped first. If the browser won't save,
// hands are kept in memory for this visit. Nothing leaves the browser.
import { useCallback, useSyncExternalStore } from "react";
import type { HandRecord } from "../game/match";

const KEY = "poker-tutor:hands";
const VERSION = 1;
export const MAX_HANDS = 50;
export const MAX_BYTES = 2 * 1024 * 1024;

/** Loads saved hands, oldest first. Unreadable data or an unknown version counts as none. */
export function loadHands(storage: Storage | null): HandRecord[] {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { version?: unknown; hands?: unknown };
    if (data?.version !== VERSION || !Array.isArray(data.hands)) return [];
    return data.hands.filter(isHandRecord);
  } catch {
    return [];
  }
}

function isHandRecord(value: unknown): value is HandRecord {
  const r = value as HandRecord;
  return (
    typeof r === "object" && r !== null && r.version === 1 && typeof r.id === "string" && Array.isArray(r.moves) &&
    typeof r.handNumber === "number" && r.final !== null && typeof r.final === "object" && typeof r.net === "number"
  );
}

/** Keeps the newest hands that fit both limits. */
export function trimHands(hands: HandRecord[]): HandRecord[] {
  let kept = hands.slice(-MAX_HANDS);
  // JSON text is stored as UTF-16, about 2 bytes per character.
  while (kept.length > 1 && JSON.stringify({ version: VERSION, hands: kept }).length * 2 > MAX_BYTES) kept = kept.slice(1);
  return kept;
}

/** Saves hands; returns false if the browser refused. */
export function saveHands(storage: Storage | null, hands: HandRecord[]): boolean {
  if (!storage) return false;
  try {
    if (hands.length === 0) storage.removeItem(KEY);
    else storage.setItem(KEY, JSON.stringify({ version: VERSION, hands }));
    return true;
  } catch {
    return false;
  }
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// One shared copy for the whole app, so Play and Review stay in step.
let hands: HandRecord[] | null = null;
let saved = true;
const listeners = new Set<() => void>();

function currentHands(): HandRecord[] {
  if (hands === null) hands = loadHands(browserStorage());
  return hands;
}

function update(next: HandRecord[]) {
  hands = trimHands(next);
  saved = saveHands(browserStorage(), hands);
  for (const listener of listeners) listener();
}

let counter = 0;

export function useHands() {
  const state = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    currentHands,
  );
  const addHand = useCallback((record: HandRecord) => {
    const stamped: HandRecord = { ...record, id: `${Date.now().toString(36)}-${(counter++).toString(36)}`, playedAt: new Date().toISOString() };
    update([...currentHands(), stamped]);
    return stamped;
  }, []);
  const clear = useCallback(() => update([]), []);
  return { hands: state, saved, addHand, clear };
}
