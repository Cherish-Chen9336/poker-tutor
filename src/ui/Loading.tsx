import type { ReactNode } from "react";

const SUITS = [
  { symbol: "♠", red: false },
  { symbol: "♥", red: true },
  { symbol: "♣", red: false },
  { symbol: "♦", red: true },
];

/**
 * Shown while something loads: a card in the middle of the screen that flips through the four suits.
 * The words are for screen readers only; the card says "loading" to everyone else.
 */
export function Loading({ children }: { children: ReactNode }) {
  return (
    <div className="loading" role="status">
      <span className="loader-card" aria-hidden="true">
        {SUITS.map((s) => (
          <span key={s.symbol} className={s.red ? "red" : undefined}>
            {s.symbol}
          </span>
        ))}
      </span>
      <span className="visually-hidden">{children}</span>
    </div>
  );
}
