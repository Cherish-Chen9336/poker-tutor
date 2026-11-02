// The Play screen's coach. It describes the situation from the learner's own
// view only: position, the current hand, draws, board threats, and the price of
// a call. It never estimates the chance of winning (that needs a model of the
// bot's cards; see CLAUDE.md, Step 5) and never says which move is "correct".
// Lines may contain card tokens like {Ah}.
import { bestFive, handName } from "./hands";
import { readHand } from "./hand-read";
import { positionOf, postflopRank } from "./positions";
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

/** "You're under the gun", "You're on the button"… */
const SEAT_PHRASE: Record<string, string> = {
  UTG: "under the gun",
  HJ: "in the hijack",
  CO: "in the cutoff",
  BTN: "on the button",
  SB: "the small blind",
  BB: "the big blind",
};

/**
 * What a line says, as facts without wording, so each language can phrase it
 * (src/i18n/coach-text.tsx). A test proves the English phrasing equals `text`.
 */
export type CoachFact =
  /** Heads-up position; `callEnds` means calling now ends all betting, so no later turn is promised. */
  | { kind: "headsUpPreflop"; button: boolean; callEnds: boolean }
  | { kind: "headsUpPostflop"; button: boolean; callEnds: boolean }
  | {
      kind: "preflopPosition";
      position: string;
      /** Where the learner acts after the flop among players who can still bet: 1 is first. */
      rank: number;
      count: number;
      /** Seats that act before the learner after the flop, in order. */
      before: string[];
    }
  /** After the flop at a full table: the learner's turn among players who can bet (0 if none), and opponents still in. */
  | { kind: "postflopPosition"; mine: number; count: number; others: number }
  /** Hole cards, highest first. */
  | { kind: "startingHand"; cards: [string, string] }
  /**
   * The best five cards and the hand's name. `shared` means the named combination is on the board, so others
   * can use it too; it does not mean their best five equal the learner's.
   */
  | { kind: "bestFive"; cards: string[]; hand: string; shared: boolean; headsUp: boolean }
  | { kind: "draw"; count: number; flush: boolean; straight: boolean; flop: boolean }
  | { kind: "boardFlush"; count: number; suit: string }
  | { kind: "boardPaired" }
  | { kind: "boardStraight" }
  | { kind: "free" }
  | { kind: "price"; toCall: number; pot: number; pct: string; allIn: boolean; sidePots: boolean; ends: boolean };

export interface CoachLine {
  topic: "position" | "hand" | "draw" | "board" | "price";
  /** The English text. */
  text: string;
  fact: CoachFact;
}

function highFirst(hole: string[]): [string, string] {
  const [a, b] = [...hole].sort((x, y) => RANKS.indexOf(y[0]) - RANKS.indexOf(x[0]));
  return [a, b];
}

function startingHand(hole: string[]): string {
  const [a, b] = highFirst(hole);
  const cards = `{${a}} {${b}}`;
  if (a[0] === b[0]) return `${cards}: a pocket pair of ${RANK_WORDS[a[0]][1]}.`;
  const suited = a[1] === b[1] ? "same suit (suited)" : "different suits";
  return `${cards}: ${RANK_WORDS[a[0]][0]}-${RANK_WORDS[b[0]][0]}, ${suited}.`;
}

/** Board features that make strong hands possible for anyone. */
function boardThreats(board: string[]): { text: string; fact: CoachFact }[] {
  const notes: { text: string; fact: CoachFact }[] = [];
  for (const suit of "shdc") {
    const n = board.filter((c) => c[1] === suit).length;
    if (n >= 3)
      notes.push({
        text: `${n === 3 ? "Three" : n === 4 ? "Four" : "Five"} ${SUIT_WORDS[suit]} on the board: a flush is possible.`,
        fact: { kind: "boardFlush", count: n, suit },
      });
  }
  const values = board.map((c) => RANKS.indexOf(c[0]) + 2);
  if (new Set(values).size < values.length)
    notes.push({ text: "The board is paired: a full house or four of a kind is possible.", fact: { kind: "boardPaired" } });
  const set = new Set(values);
  if (set.has(14)) set.add(1);
  for (let low = 1; low <= 10; low++) {
    const inWindow = [0, 1, 2, 3, 4].filter((d) => set.has(low + d)).length;
    if (inWindow >= 3) {
      notes.push({ text: "Three cards close in rank: a straight is possible.", fact: { kind: "boardStraight" } });
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

  const n = view.seats.length;
  const live = view.seats.filter((s) => s && (s.status === "active" || s.status === "all-in"));
  const ordinal = (k: number) => ["first", "second", "third", "fourth", "fifth", "sixth"][k - 1];

  // Whether calling now would end all betting in the hand: nobody else could still bet after it
  // (everyone else still in is all-in), the call puts the learner all-in, or (on the river) it closes the betting.
  const price = callPrice(view, seat);
  const highest = Math.max(...view.seats.map((s) => s?.betThisStreet ?? 0));
  const othersWithChips = live.filter((s) => s!.seat !== seat && s!.status === "active" && s!.stack > 0);
  const callEnds =
    !!price &&
    (price.toCall >= me.stack || othersWithChips.length === 0 || (view.street === "river" && othersWithChips.every((s) => s!.betThisStreet === highest)));

  // Position (lessons 4 and 15).
  if (n === 2 && callEnds) {
    // Heads-up, the usual "who acts first" sentence would promise a later turn that can't happen.
    lines.push({ topic: "position", text: "If you call, betting ends for this hand.", fact: { kind: preflop ? "headsUpPreflop" : "headsUpPostflop", button, callEnds: true } });
  } else if (n === 2) {
    if (preflop) {
      lines.push({
        topic: "position",
        text: button
          ? "You have the button: you act first before the flop, and last on every later round."
          : "You're the big blind: you act last before the flop, and first on every later round.",
        fact: { kind: "headsUpPreflop", button, callEnds: false },
      });
    } else {
      lines.push({
        topic: "position",
        text: button ? "You act last this round, so you'll see the bot's choice first (in position)." : "You act first this round; the bot will see your choice before deciding.",
        fact: { kind: "headsUpPostflop", button, callEnds: false },
      });
    }
  } else if (preflop) {
    // States the order plainly rather than counting who's left: after a raise, everyone
    // who already acted gets another turn, so a count of "players after you" can mislead.
    const position = positionOf(view, seat);
    // Later rounds: count only players who still have chips to bet (all-in players stay in but don't act).
    const actors = view.seats.filter((s) => s && s.status !== "folded" && s.status !== "out" && s.status !== "all-in" && s.stack + s.betThisStreet > 0);
    const rank = actors.filter((s) => postflopRank(view, s!.seat) <= postflopRank(view, seat)).length;
    // Says of how many and after whom, so the count is checkable against the table (it leaves out folded players).
    const beforeSeats = actors
      .filter((s) => postflopRank(view, s!.seat) < postflopRank(view, seat))
      .sort((a, b) => postflopRank(view, a!.seat) - postflopRank(view, b!.seat))
      .map((s) => positionOf(view, s!.seat));
    const before = beforeSeats.map((p) => `the ${p}`);
    const after = before.length <= 2 ? before.join(" and ") : `${before.slice(0, -1).join(", ")}, and ${before.at(-1)}`;
    // With nobody else able to bet, staying in ends the betting: the remaining cards are dealt out.
    const later =
      actors.length === 1
        ? "if you stay in, nobody can bet after this round: the remaining cards are dealt out"
        : rank === actors.length
          ? "you act last on every later round"
          : rank === 1
            ? `if all ${actors.length} players who can bet now still can, you act first`
            : `if all ${actors.length} players who can bet now still can, you act ${ordinal(rank)}, after ${after}`;
    lines.push({
      topic: "position",
      text: `You're ${SEAT_PHRASE[position]} (${position}). Before the flop, action goes from under the gun to the big blind, skipping players who can't act, and a raise gives the others who can still act another turn. After the flop, ${later}.`,
      fact: { kind: "preflopPosition", position, rank, count: actors.length, before: beforeSeats },
    });
  } else {
    // Only players with chips left take turns; all-in players are still in the hand but don't act.
    const actors = live.filter((s) => s!.status === "active" && s!.stack > 0).map((s) => s!.seat).sort((a, b) => postflopRank(view, a) - postflopRank(view, b));
    const mine = actors.indexOf(seat) + 1;
    const others = live.length - 1;
    const where =
      mine === actors.length ? "You act last this round (in position)" : mine === 1 ? "You act first this round" : `You act ${ordinal(mine)} of the ${actors.length} players who can still bet`;
    lines.push({
      topic: "position",
      text: `${where}. ${others} ${others === 1 ? "opponent is" : "opponents are"} still in.`,
      fact: { kind: "postflopPosition", mine, count: actors.length, others },
    });
  }

  // The hand.
  if (preflop) {
    lines.push({ topic: "hand", text: `Your cards: ${startingHand(hole)}`, fact: { kind: "startingHand", cards: highFirst(hole) } });
  } else {
    const all = [...hole, ...view.board];
    const description = handName(all);
    const name = description.toLowerCase();
    const best = displayOrder(bestFive(all));
    const read = readHand(hole, view.board);
    const shared = (read.strength === "nothing" || read.strength === "aceHigh") && name !== "high card";
    let text = `Your best five: ${best.map((c) => `{${c}}`).join(" ")}, ${name}.`;
    if (shared) text += ` The ${name} is on the board, so ${n === 2 ? "the bot shares it" : "everyone still in shares it"}.`;
    lines.push({ topic: "hand", text, fact: { kind: "bestFive", cards: best, hand: description, shared, headsUp: n === 2 } });

    if (read.drawCards.length) {
      const kinds = [read.flushDraw ? "flush" : null, read.straightDraw ? "straight" : null].filter(Boolean).join(" or ");
      const more = view.board.length === 3 ? "on the turn or river" : "on the river";
      lines.push({
        topic: "draw",
        text: `${read.drawCards.length} unseen cards could complete a ${kinds} ${more}. Even then, a stronger hand could still beat you.`,
        fact: { kind: "draw", count: read.drawCards.length, flush: read.flushDraw, straight: !!read.straightDraw, flop: view.board.length === 3 },
      });
    }
    for (const note of boardThreats(view.board)) lines.push({ topic: "board", ...note });
  }

  // The price (lesson 9).
  if (!price) {
    lines.push({ topic: "price", text: "Nothing to call: you can check for free.", fact: { kind: "free" } });
  } else {
    const pct = (price.breakEven * 100).toFixed(1);
    const allIn =
      price.toCall >= me.stack
        ? " Calling puts you all-in: you'd put in nothing more. If at least two opponents match extra chips beyond your total contribution, those matched chips form side pots you can't win."
        : "";
    const sidePots = view.pots.length > 1 ? " With side pots, this lumps together the pots you can win." : "";
    const ends = callEnds;
    const caveat = ends
      ? "We haven't estimated your chance of winning."
      : "More betting may follow, which changes this math. We haven't estimated your chance of winning.";
    lines.push({
      topic: "price",
      text: `Calling costs ${price.toCall} to win a pot of ${price.potIfCalled}. If the betting ended here, you'd need to win at least ${pct}% of the pot on average to break even (a tie earns your share of it).${allIn}${sidePots} ${caveat}`,
      fact: { kind: "price", toCall: price.toCall, pot: price.potIfCalled, pct, allIn: !!allIn, sidePots: !!sidePots, ends },
    });
  }
  return lines;
}
