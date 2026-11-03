import type { ReactNode } from "react";

// "\uFE0E" asks for the plain text symbol, not a colored emoji (some phones draw ♥ and ♦ as emoji otherwise).
const SUITS = [
  { symbol: "♠\uFE0E", red: false },
  { symbol: "♥\uFE0E", red: true },
  { symbol: "♣\uFE0E", red: false },
  { symbol: "♦\uFE0E", red: true },
];

/**
 * Shown while something loads: the four suits in a row in the middle of the screen, bouncing one after another
 * like a wave. The words are for screen readers only; the suits say "loading" to everyone else.
 */
export function Loading({ children, later = false }: { children: ReactNode; later?: boolean }) {
  // `later`: over a page that's still on screen, appearing only if the wait is long enough to notice.
  return (
    <div className={later ? "loading later" : "loading"} role="status">
      <span className="loader-suits" aria-hidden="true">
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
