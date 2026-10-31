// Played hands, saved in this browser for the Review screen. At most 50 hands
// and about 2 MiB; the oldest are dropped first. If the browser won't save,
// hands are kept in memory for this visit. Nothing leaves the browser.
import { useCallback, useSyncExternalStore } from "react";
import type { HandRecord, SeatInfo } from "../game/match";

const KEY = "poker-tutor:hands";
/** Version 1 held heads-up records only; version 2 holds records for 2–6 seats. */
const VERSION = 2;
export const MAX_HANDS = 50;
export const MAX_BYTES = 2 * 1024 * 1024;

/** Loads saved hands, oldest first. Unreadable data or an unknown version counts as none. */
export function loadHands(storage: Storage | null): HandRecord[] {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { version?: unknown; hands?: unknown };
    if ((data?.version !== 1 && data?.version !== VERSION) || !Array.isArray(data.hands)) return [];
    return trimHands(data.hands.map(upgrade).filter(isHandRecord));
  } catch {
    return [];
  }
}

const CARD = /^[2-9TJQKA][shdc]$/;
const STATUSES = ["active", "folded", "all-in", "out"];
const STREETS = ["preflop", "flop", "turn", "river", "showdown"];
const MOVES = ["fold", "check", "call", "bet", "raise"];
const isNumber = (v: unknown) => typeof v === "number" && Number.isFinite(v);

const isIndex = (v: unknown, n: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < n;
const isIndexOrNull = (v: unknown, n: number) => v === null || isIndex(v, n);

function isSeat(value: unknown, index: number): boolean {
  const s = value as { seat?: unknown; stack?: unknown; betThisStreet?: unknown; status?: unknown; cards?: unknown; name?: unknown };
  return (
    typeof s === "object" && s !== null && s.seat === index && isNumber(s.stack) && isNumber(s.betThisStreet) &&
    typeof s.name === "string" && STATUSES.includes(s.status as string) &&
    (s.cards === null || (Array.isArray(s.cards) && s.cards.length === 2 && s.cards.every((c) => c === null || (typeof c === "string" && CARD.test(c)))))
  );
}

function isWinner(value: unknown, n: number): boolean {
  const w = value as { seat?: unknown; amount?: unknown; bestHand?: unknown; description?: unknown };
  return (
    typeof w === "object" && w !== null && isIndex(w.seat, n) && isNumber(w.amount) &&
    (w.description === null || typeof w.description === "string") &&
    (w.bestHand === null || (Array.isArray(w.bestHand) && w.bestHand.every((c) => typeof c === "string" && CARD.test(c))))
  );
}

function isPotResult(value: unknown, n: number): boolean {
  const p = value as { amount?: unknown; eligibleSeats?: unknown; winners?: unknown };
  return (
    typeof p === "object" && p !== null && isNumber(p.amount) &&
    Array.isArray(p.eligibleSeats) && p.eligibleSeats.every((seat) => isIndex(seat, n)) &&
    Array.isArray(p.winners) && p.winners.length > 0 &&
    p.winners.every((w) => typeof w === "object" && w !== null && isIndex((w as { seat?: unknown }).seat, n) && isNumber((w as { amount?: unknown }).amount))
  );
}

function isRange(value: unknown): boolean {
  const r = value as { min?: unknown; max?: unknown };
  return value === null || (typeof r === "object" && isNumber(r.min) && isNumber(r.max));
}

/** The learner's legal moves: exactly the shape the Review screen's judgments read. */
function isLegal(value: unknown): boolean {
  const l = value as { fold?: unknown; check?: unknown; call?: unknown; bet?: unknown; raise?: unknown };
  return (
    typeof l === "object" && l !== null && typeof l.fold === "boolean" && typeof l.check === "boolean" &&
    (l.call === null || isNumber(l.call)) && isRange(l.bet) && isRange(l.raise)
  );
}

/** Every part of a table view that the Review screen reads, for a table of `n` seats seen by `learner`. */
function isView(value: unknown, n: number, learner: number): boolean {
  const v = value as Record<string, unknown>;
  return (
    typeof v === "object" && v !== null && v.viewerSeat === learner && STREETS.includes(v.street as string) &&
    Array.isArray(v.seats) && v.seats.length === n && v.seats.every((seat, i) => isSeat(seat, i)) &&
    Array.isArray(v.board) && v.board.length <= 5 && v.board.every((c) => typeof c === "string" && CARD.test(c)) &&
    Array.isArray(v.pots) &&
    v.pots.every((p) => {
      const pot = p as { amount?: unknown; eligibleSeats?: unknown };
      return typeof p === "object" && p !== null && isNumber(pot.amount) && Array.isArray(pot.eligibleSeats) && pot.eligibleSeats.every((seat) => isIndex(seat, n));
    }) &&
    isIndexOrNull(v.buttonSeat, n) && isIndexOrNull(v.bigBlindSeat, n) && isIndexOrNull(v.actionTo, n) &&
    isNumber(v.smallBlind) && isNumber(v.bigBlind) && typeof v.handOver === "boolean" &&
    (v.winners === null || (Array.isArray(v.winners) && v.winners.every((w) => isWinner(w, n)))) &&
    (v.potResults === undefined || v.potResults === null || (Array.isArray(v.potResults) && v.potResults.every((p) => isPotResult(p, n))))
  );
}

function isMove(value: unknown, n: number, learner: number): boolean {
  const m = value as { actorSeat?: unknown; move?: { type?: unknown; to?: unknown }; view?: unknown; after?: unknown; legal?: unknown };
  const move = m?.move;
  return (
    typeof m === "object" && m !== null && isIndex(m.actorSeat, n) &&
    typeof move === "object" && move !== null && MOVES.includes(move.type as string) &&
    (move.type !== "bet" && move.type !== "raise" ? true : isNumber(move.to)) &&
    isView(m.view, n, learner) && isView(m.after, n, learner) && (m.actorSeat === learner ? isLegal(m.legal) : m.legal === null)
  );
}

function isSeatInfo(value: unknown, index: number, learner: number): boolean {
  const s = value as SeatInfo;
  return typeof s === "object" && s !== null && s.seat === index && typeof s.name === "string" && s.learner === (index === learner);
}

/** Checks a loaded record closely enough that the Review screen can show it safely. */
export function isHandRecord(value: unknown): value is HandRecord {
  const r = value as HandRecord;
  if (typeof r !== "object" || r === null || r.version !== 2 || !Array.isArray(r.seats)) return false;
  const n = r.seats.length;
  const learner = r.learnerSeat;
  return (
    n >= 2 && n <= 6 && isIndex(learner, n) && r.seats.every((seat, i) => isSeatInfo(seat, i, learner)) &&
    typeof r.id === "string" && typeof r.botVersion === "string" && isNumber(r.matchNumber) && isNumber(r.handNumber) &&
    Array.isArray(r.startStacks) && r.startStacks.length === n && r.startStacks.every(isNumber) &&
    Array.isArray(r.toppedUp) && r.toppedUp.every((seat) => isIndex(seat, n) && seat !== learner) &&
    Array.isArray(r.moves) && r.moves.every((m) => isMove(m, n, learner)) &&
    isView(r.final, n, learner) && (r.final as { handOver?: unknown }).handOver === true &&
    Array.isArray((r.final as { winners?: unknown }).winners) && isNumber(r.net)
  );
}

/**
 * Converts a version 1 (heads-up) record to version 2: two seats, the learner
 * in seat 0, and each move's "you"/"bot" turned into a seat number. Anything
 * else is passed through for `isHandRecord` to judge.
 */
export function upgrade(value: unknown): unknown {
  const r = value as { version?: unknown; moves?: unknown };
  if (typeof r !== "object" || r === null || r.version !== 1 || !Array.isArray(r.moves)) return value;
  return {
    ...r,
    version: 2,
    learnerSeat: 0,
    seats: [
      { seat: 0, name: "You", learner: true },
      { seat: 1, name: "Bot", learner: false },
    ],
    toppedUp: [],
    moves: r.moves.map((m) => {
      if (typeof m !== "object" || m === null) return m;
      const { who, ...rest } = m as { who?: unknown };
      return { ...rest, actorSeat: who === "you" ? 0 : who === "bot" ? 1 : -1 };
    }),
  };
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
