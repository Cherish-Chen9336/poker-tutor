// A structural reading of a hand: how much the player's own cards add, and
// which draws they have. Used by the bot and the coach. These are rough
// categories for practice play and plain-English hints, not a strength model.
import { compareHands, handScore } from "./hands";

export type Strength = "strong" | "topPair" | "lowerPair" | "aceHigh" | "nothing";

export interface HandRead {
  strength: Strength;
  flushDraw: boolean;
  /** "open": two or more ranks would complete a straight; "gutshot": exactly one. */
  straightDraw: "open" | "gutshot" | null;
  /** Unseen cards that would complete a flush or straight (each card counted once). */
  drawCards: string[];
}

const RANKS = "23456789TJQKA";
const value = (card: string) => RANKS.indexOf(card[0]) + 2;

/** True if these rank values (2–14) contain five in a row; an ace also counts as 1. */
function hasStraight(values: number[]): boolean {
  const set = new Set(values);
  if (set.has(14)) set.add(1);
  for (let high = 14; high >= 5; high--) {
    let run = true;
    for (let v = high; v > high - 5; v--) if (!set.has(v)) run = false;
    if (run) return true;
  }
  return false;
}

function flushSuit(cards: string[]): string | null {
  for (const suit of "shdc") if (cards.filter((c) => c[1] === suit).length >= 5) return suit;
  return null;
}

/** Reads `hole` (2 cards) with `board` (3–5 cards). */
export function readHand(hole: string[], board: string[]): HandRead {
  const all = [...hole, ...board];
  const holeV = hole.map(value);
  const boardV = board.map(value);
  const boardCount = (v: number) => boardV.filter((b) => b === v).length;
  const pocket = holeV[0] === holeV[1];
  const boardMax = Math.max(...boardV);
  const boardPaired = new Set(boardV).size < boardV.length;
  const boardSuitMax = Math.max(...[..."shdc"].map((s) => board.filter((c) => c[1] === s).length));

  // Made hands that rely on the player's own cards.
  const set = pocket && boardCount(holeV[0]) >= 1;
  const tripsOneCard = !pocket && holeV.some((v) => boardCount(v) >= 2);
  const twoPairBoth = !pocket && holeV.every((v) => boardCount(v) >= 1);
  const straight = hasStraight([...holeV, ...boardV]) && !hasStraight(boardV);
  const suit = flushSuit(all);
  const flush = suit !== null && hole.some((c) => c[1] === suit) && flushSuit(board) === null;

  // On the river, if the five board cards are already the best hand, the
  // player's own cards add nothing ("playing the board").
  const playsBoard = board.length === 5 && handScore(all) === handScore(board);

  let strength: Strength;
  if (playsBoard) {
    strength = "nothing";
  } else if (flush) {
    // A flush is vulnerable on a paired board, and a low flush on a four-flush board.
    const best = Math.max(...hole.filter((c) => c[1] === suit).map(value));
    strength = boardPaired || (boardSuitMax >= 4 && best < value("Q")) ? "topPair" : "strong";
  } else if (straight) {
    strength = boardPaired || boardSuitMax >= 3 ? "topPair" : "strong";
  } else if (set || tripsOneCard || twoPairBoth) {
    strength = "strong";
  } else if ((pocket && holeV[0] > boardMax) || holeV.includes(boardMax)) {
    strength = "topPair";
  } else if (pocket || holeV.some((v) => boardCount(v) >= 1)) {
    strength = "lowerPair";
  } else if (holeV.includes(14)) {
    strength = "aceHigh";
  } else {
    strength = "nothing";
  }

  // Draws, only while cards are still to come.
  const seen = new Set(all);
  const unseen = [...RANKS].flatMap((r) => [..."shdc"].map((s) => r + s)).filter((c) => !seen.has(c));
  const drawCards = new Set<string>();
  let flushDraw = false;
  let straightRanks = 0;
  if (board.length < 5) {
    for (const s of "shdc") {
      const count = all.filter((c) => c[1] === s).length;
      if (count === 4 && hole.some((c) => c[1] === s) && !flush) {
        flushDraw = true;
        unseen.filter((c) => c[1] === s).forEach((c) => drawCards.add(c));
      }
    }
    if (!straight && !flush) {
      for (let v = 2; v <= 14; v++) {
        if (hasStraight([...holeV, ...boardV, v]) && !hasStraight([...boardV, v])) {
          straightRanks++;
          unseen.filter((c) => value(c) === v).forEach((c) => drawCards.add(c));
        }
      }
    }
  }
  const straightDraw = straightRanks >= 2 ? "open" : straightRanks === 1 ? "gutshot" : null;
  return { strength, flushDraw, straightDraw, drawCards: [...drawCards] };
}

/** On the river: true if no possible opponent holding beats this hand (ties allowed). */
export function isUnbeatable(hole: string[], board: string[]): boolean {
  const seen = new Set([...hole, ...board]);
  const unseen = [...RANKS].flatMap((r) => [..."shdc"].map((s) => r + s)).filter((c) => !seen.has(c));
  for (let i = 0; i < unseen.length; i++) {
    for (let j = i + 1; j < unseen.length; j++) {
      if (compareHands(hole, [unseen[i], unseen[j]], board) === "b") return false;
    }
  }
  return true;
}
