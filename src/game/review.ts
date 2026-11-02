// Comments on the learner's decisions for the Review screen. Each comment uses
// only what the learner could see at that moment (the recorded view), never
// the bot's cards or later cards, and never the result. It judges only what
// can be proven (see CLAUDE.md, Step 5); otherwise it explains the price and
// says what the decision depended on. Text may contain card tokens like {Ah}.
import { readHand, isUnbeatable } from "./hand-read";
import { describeMove } from "./hand-log";
import type { HandRecord, RecordedMove } from "./match";
import { callPrice, potTotal } from "./pot-math";
import type { Move } from "./types";

export type Verdict = "mistake" | "good" | "note";

/** A comment as facts, worded per language by src/i18n/review-text.ts (`text` is the English). */
export type CommentFact =
  | { kind: "freeFold" }
  | { kind: "unbeatableFold" }
  | { kind: "unbeatable" }
  | { kind: "note"; parts: NotePart[]; chose: Move; call: number | null };

export type NotePart =
  | { kind: "price"; toCall: number; pot: number; pct: string }
  | { kind: "draw"; count: number }
  | { kind: "size"; added: number; share: Share; pot: number }
  | { kind: "foldDepends" }
  | { kind: "callDepends" }
  | { kind: "checkFree" };

export type Share = "third" | "half" | "twoThirds" | "pot" | "more";

export interface DecisionComment {
  /** Index into record.moves. */
  moveIndex: number;
  verdict: Verdict;
  text: string;
  fact: CommentFact;
}

function shareOf(amount: number, pot: number): Share {
  const ratio = amount / pot;
  if (ratio <= 0.4) return "third";
  if (ratio <= 0.6) return "half";
  if (ratio <= 0.85) return "twoThirds";
  if (ratio <= 1.15) return "pot";
  return "more";
}

const SHARE_WORDS: Record<Share, string> = {
  third: "about a third of the pot or less",
  half: "about half the pot",
  twoThirds: "about two-thirds of the pot",
  pot: "about the size of the pot",
  more: "more than the pot",
};

/** The comment for one of the learner's moves. */
export function commentOn(step: RecordedMove): { verdict: Verdict; text: string; fact: CommentFact } {
  const view = step.view;
  const seat = view.viewerSeat!;
  const me = view.seats[seat]!;
  const hole = (me.cards ?? []).filter((c): c is string => c !== null);
  const legal = step.legal;
  const move = step.move;
  const river = view.board.length === 5;
  const unbeatable = river && hole.length === 2 && isUnbeatable(hole, view.board);
  const price = callPrice(view, seat);

  // Provable mistakes.
  if (move.type === "fold" && legal?.check) {
    return { verdict: "mistake", text: "Checking was free here. Folding gave up your share of the pot without saving any chips.", fact: { kind: "freeFold" } };
  }
  if (move.type === "fold" && unbeatable) {
    return {
      verdict: "mistake",
      text: "On this river no possible hand could beat yours (checked against every hand the bot could hold; at worst a tie). Folding gave up a pot you couldn't lose.",
      fact: { kind: "unbeatableFold" },
    };
  }

  // Provably fine: never folding an unbeatable river hand.
  if (unbeatable) {
    return {
      verdict: "good",
      text: "No possible hand could beat yours on this river (at worst a tie), so keeping your claim to the pot was right.",
      fact: { kind: "unbeatable" },
    };
  }

  // Everything else: explain, without grading.
  const parts: string[] = [];
  const facts: NotePart[] = [];
  if (price) {
    const pct = (price.breakEven * 100).toFixed(1);
    parts.push(
      `Calling cost ${price.toCall} to win a pot of ${price.potIfCalled}: to break even, you needed at least ${pct}% of the pot on average (a tie earns your share), if the betting ended there.`,
    );
    facts.push({ kind: "price", toCall: price.toCall, pot: price.potIfCalled, pct });
  }
  if (!river && view.board.length >= 3 && hole.length === 2) {
    const read = readHand(hole, view.board);
    if (read.drawCards.length) {
      parts.push(`${read.drawCards.length} unseen cards could have completed your draw, though some might still have lost.`);
      facts.push({ kind: "draw", count: read.drawCards.length });
    }
  }
  if (move.type === "bet" || move.type === "raise") {
    const pot = potTotal(view);
    const added = move.to - me.betThisStreet;
    const share = shareOf(added, pot);
    parts.push(`You put in ${added} more, ${SHARE_WORDS[share]} (${pot} before your move).`);
    facts.push({ kind: "size", added, share, pot });
  }
  if (move.type === "fold" && price) {
    parts.push("Whether folding was right depends on how often the bot had a better hand here, which the app can't know.");
    facts.push({ kind: "foldDepends" });
  } else if (move.type === "call" && price) {
    parts.push("Whether calling paid off on average depends on how often you'd win from here, which the app can't know.");
    facts.push({ kind: "callDepends" });
  } else if (move.type === "check") {
    parts.push("Checking was free; it kept the pot the same size.");
    facts.push({ kind: "checkFree" });
  }
  return {
    verdict: "note",
    text: parts.join(" ") || `You chose to ${describeMove(move, legal?.call ?? null)}.`,
    fact: { kind: "note", parts: facts, chose: move, call: legal?.call ?? null },
  };
}

/** Comments for every learner decision in a hand. */
export function reviewHand(record: HandRecord): DecisionComment[] {
  return record.moves.flatMap((step, moveIndex) => (step.actorSeat === record.learnerSeat ? [{ moveIndex, ...commentOn(step) }] : []));
}
