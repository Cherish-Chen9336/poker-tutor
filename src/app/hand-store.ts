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
    return trimHands(data.hands.filter(isHandRecord));
  } catch {
    return [];
  }
}

function isView(value: unknown): boolean {
  const v = value as { seats?: unknown; board?: unknown; street?: unknown; pots?: unknown };
  return (
    typeof v === "object" && v !== null && Array.isArray(v.seats) && v.seats.length === 2 &&
    v.seats.every((seat) => seat === null || (typeof seat === "object" && typeof (seat as { stack?: unknown }).stack === "number")) &&
    Array.isArray(v.board) && v.board.every((c) => typeof c === "string") && typeof v.street === "string" && Array.isArray(v.pots)
  );
}

function isMove(value: unknown): boolean {
  const m = value as { who?: unknown; move?: { type?: unknown }; view?: unknown; after?: unknown; legal?: unknown };
  return (
    typeof m === "object" && m !== null && (m.who === "you" || m.who === "bot") && typeof m.move?.type === "string" &&
    isView(m.view) && isView(m.after) && (m.legal === null || typeof m.legal === "object")
  );
}

/** Checks a loaded record closely enough that the Review screen can show it safely. */
export function isHandRecord(value: unknown): value is HandRecord {
  const r = value as HandRecord;
  return (
    typeof r === "object" && r !== null && r.version === 1 && typeof r.id === "string" && typeof r.botVersion === "string" &&
    typeof r.matchNumber === "number" && typeof r.handNumber === "number" && Array.isArray(r.startStacks) &&
    r.startStacks.length === 2 && Array.isArray(r.moves) && r.moves.every(isMove) && isView(r.final) && typeof r.net === "number"
  );
}

/** Keeps the newest hands that fit both limits. */
export function trimHands(hands: HandRecord[]): HandRecord[] {
  const size = (value: unknown) => JSON.stringify(value).length * 2; // stored as UTF-16, about 2 bytes per character
  // A single record too big to fit is dropped rather than allowed to fill the space.
  let kept = hands.filter((hand) => size(hand) <= MAX_BYTES / 4).slice(-MAX_HANDS);
  while (kept.length > 1 && size({ version: VERSION, hands: kept }) > MAX_BYTES) kept = kept.slice(1);
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
const NO_HANDS: HandRecord[] = [];

export function useHands() {
  const state = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    currentHands,
    () => NO_HANDS, // when rendered outside a browser (tests), there are no saved hands
  );
  const addHand = useCallback((record: HandRecord) => {
    const stamped: HandRecord = { ...record, id: `${Date.now().toString(36)}-${(counter++).toString(36)}`, playedAt: new Date().toISOString() };
    update([...currentHands(), stamped]);
    return stamped;
  }, []);
  const clear = useCallback(() => update([]), []);
  return { hands: state, saved, addHand, clear };
}
