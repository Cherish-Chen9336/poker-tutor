// The Play screen's coach. It describes the situation from the learner's own
// view only: position, the current hand, draws, board threats, and the price of
// a call. It never estimates the chance of winning (that needs a model of the
// bot's cards; see CLAUDE.md, Step 5) and never says which move is "correct".
// Lines may contain card tokens like {Ah}.
import { bestFive, handName } from "./hands";
import { readHand } from "./hand-read";
import { callPrice } from "./pot-math";
import type { TableView } from "./types";

const RANKS = "23456789TJQKA";
const RANK_WORDS: Record<string, [string, string]> = {
  A: ["ace", "aces"], K: ["king", "kings"], Q: ["queen", "queens"], J: ["jack", "jacks"], T: ["10", "10s"],
  "9": ["9", "9s"], "8": ["8", "8s"], "7": ["7", "7s"], "6": ["6", "6s"], "5": ["5", "5s"], "4": ["4", "4s"], "3": ["3", "3s"], "2": ["2", "2s"],
};
const SUIT_WORDS: Record<string, string> = { s: "spades", h: "hearts", d: "diamonds", c: "clubs" };

/** Readable order: matched cards first (sets, then pairs), then by rank, highest first. */
export function displayOrder(cards: string[]): string[] {
  const count = (card: string) => cards.filter((c) => c[0] === card[0]).length;
  return [...cards].sort((a, b) => count(b) - count(a) || RANKS.indexOf(b[0]) - RANKS.indexOf(a[0]));
}

export interface CoachLine {
  topic: "position" | "hand" | "draw" | "board" | "price";
  text: string;
}

function startingHand(hole: string[]): string {
  const [a, b] = [...hole].sort((x, y) => RANKS.indexOf(y[0]) - RANKS.indexOf(x[0]));
  const cards = `{${a}} {${b}}`;
  if (a[0] === b[0]) return `${cards}: a pocket pair of ${RANK_WORDS[a[0]][1]}.`;
  const suited = a[1] === b[1] ? "same suit (suited)" : "different suits";
  return `${cards}: ${RANK_WORDS[a[0]][0]}-${RANK_WORDS[b[0]][0]}, ${suited}.`;
}

/** Board features that make strong hands possible for anyone. */
function boardThreats(board: string[]): string[] {
  const notes: string[] = [];
  for (const suit of "shdc") {
    const n = board.filter((c) => c[1] === suit).length;
    if (n >= 3) notes.push(`${n === 3 ? "Three" : n === 4 ? "Four" : "Five"} ${SUIT_WORDS[suit]} on the board: a flush is possible.`);
  }
  const values = board.map((c) => RANKS.indexOf(c[0]) + 2);
  if (new Set(values).size < values.length) notes.push("The board is paired: a full house or four of a kind is possible.");
  const set = new Set(values);
  if (set.has(14)) set.add(1);
  for (let low = 1; low <= 10; low++) {
    const inWindow = [0, 1, 2, 3, 4].filter((d) => set.has(low + d)).length;
    if (inWindow >= 3) {
      notes.push("Three cards close in rank: a straight is possible.");
      break;
    }
  }
  return notes;
}

export function coachLines(view: TableView): CoachLine[] {
  const seat = view.viewerSeat;
  if (seat === null || view.handOver) return [];
  const me = view.seats[seat]!;
  const hole = (me.cards ?? []).filter((c): c is string => c !== null);
  if (hole.length < 2) return [];
  const lines: CoachLine[] = [];
  const button = view.buttonSeat === seat;
  const preflop = view.street === "preflop";

  // Position (lesson 4).
  if (preflop) {
    lines.push({
      topic: "position",
      text: button
        ? "You have the button: you act first before the flop, and last on every later round."
        : "You're the big blind: you act last before the flop, and first on every later round.",
    });
  } else {
    lines.push({
      topic: "position",
      text: button ? "You act last this round, so you'll see the bot's choice first (in position)." : "You act first this round; the bot will see your choice before deciding.",
    });
  }

  // The hand.
  if (preflop) {
    lines.push({ topic: "hand", text: `Your cards: ${startingHand(hole)}` });
  } else {
    const all = [...hole, ...view.board];
    const name = handName(all).toLowerCase();
    const best = displayOrder(bestFive(all));
    const read = readHand(hole, view.board);
    const shared = (read.strength === "nothing" || read.strength === "aceHigh") && name !== "high card";
    let text = `Your best five: ${best.map((c) => `{${c}}`).join(" ")}, ${name}.`;
    if (shared) text += ` The ${name} is on the board, so the bot shares it.`;
    lines.push({ topic: "hand", text });

    if (read.drawCards.length) {
      const kinds = [read.flushDraw ? "flush" : null, read.straightDraw ? "straight" : null].filter(Boolean).join(" or ");
      const more = view.board.length === 3 ? "on the turn or river" : "on the river";
      lines.push({
        topic: "draw",
        text: `${read.drawCards.length} unseen cards could complete a ${kinds} ${more}. Even then, a stronger hand could still beat you.`,
      });
    }
    for (const note of boardThreats(view.board)) lines.push({ topic: "board", text: note });
  }

  // The price (lesson 9).
  const price = callPrice(view, seat);
  if (!price) {
    lines.push({ topic: "price", text: "Nothing to call: you can check for free." });
  } else {
    const pct = (price.breakEven * 100).toFixed(1);
    const allIn = price.toCall >= me.stack ? " Calling puts you all-in." : "";
    const opponent = view.seats[1 - seat];
    const ends = view.street === "river" || opponent?.status === "all-in" || price.toCall >= me.stack;
    const caveat = ends
      ? "We haven't estimated your chance of winning."
      : "More betting may follow, which changes this math. We haven't estimated your chance of winning.";
    lines.push({
      topic: "price",
      text: `Calling costs ${price.toCall} to win a pot of ${price.potIfCalled}. If the betting ended here, you'd need to win ${pct}% of the time to break even, counting a tie as half a win.${allIn} ${caveat}`,
    });
  }
  return lines;
}
