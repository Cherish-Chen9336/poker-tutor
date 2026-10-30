// Playing cards. Each card has a spoken name (e.g. "ace of hearts") and
// shows its suit symbol, so red vs. black is never the only clue.
import { Fragment, type ReactNode } from "react";
import { cardName, rankLabel, SUITS } from "./card-names";

interface CardProps {
  code: string;
  size?: "sm" | "md" | "lg";
  /** Highlights a card that counts toward the hand. */
  lit?: boolean;
  /** Fades a card that doesn't count. */
  dim?: boolean;
}

/** A face-up card, as a picture with a spoken name. */
export function Card({ code, size = "md", lit, dim }: CardProps) {
  const suit = SUITS[code[1]];
  const classes = ["pc", size, suit.red ? "red" : "", lit ? "lit" : "", dim ? "dim" : ""].filter(Boolean).join(" ");
  return (
    <span className={classes} role="img" aria-label={cardName(code)}>
      <span className="r" aria-hidden="true">{rankLabel(code)}</span>
      <span className="s" aria-hidden="true">{suit.symbol}</span>
    </span>
  );
}

/** A row of cards. `lit` lists the codes to highlight; the others are dimmed. */
export function Cards({ codes, size, lit }: { codes: string[]; size?: CardProps["size"]; lit?: string[] }) {
  return (
    <span className="pc-row">
      {codes.map((code) => (
        <Card key={code} code={code} size={size} lit={lit?.includes(code)} dim={lit !== undefined && !lit.includes(code)} />
      ))}
    </span>
  );
}

/** A card inside running text, such as "You hold A♥". */
export function C({ c }: { c: string }) {
  const suit = SUITS[c[1]];
  return (
    <span className={suit.red ? "ic red" : "ic"} role="img" aria-label={cardName(c)}>
      <span aria-hidden="true">
        {rankLabel(c)}
        {suit.symbol}
      </span>
    </span>
  );
}

/** Renders text with card tokens like {Ah} as inline cards. */
export function CardText({ text }: { text: string }): ReactNode {
  return text.split(/(\{[2-9TJQKA][shdc]\})/).map((part, i) =>
    /^\{..\}$/.test(part) ? <C key={i} c={part.slice(1, 3)} /> : <Fragment key={i}>{part}</Fragment>,
  );
}
