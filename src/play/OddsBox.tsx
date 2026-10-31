// The coach's win-odds estimate: the learner's share of the pot against
// random hands, with its assumptions. It describes; it never advises.
import type { Equity } from "../game/equity";
import type { EquityState } from "./useEquity";

function amount(equity: Equity): string {
  if (equity.exact) return `${(equity.share * 100).toFixed(1)}%`;
  const margin = Math.max(1, Math.round(equity.margin * 100));
  return `about ${Math.round(equity.share * 100)}% (±${margin})`;
}

const hands = (n: number) => `${n === 1 ? "a" : n} random ${n === 1 ? "hand" : "hands"}`;

export function OddsBox({ estimates }: { estimates: EquityState[] }) {
  const single = estimates.length === 1;
  return (
    <div className="odds-box" aria-live="polite">
      <b className="odds-title">Odds estimate</b>
      {single ? (
        <p>
          Against {hands(estimates[0].request.opponents)}, your estimated share at showdown is{" "}
          {estimates[0].equity ? amount(estimates[0].equity) : "…"}, including shared wins.
        </p>
      ) : (
        <ul>
          {estimates.map(({ request, equity }) => (
            <li key={request.label}>
              For {request.label}, against {hands(request.opponents)}: {equity ? amount(equity) : "…"}.
            </li>
          ))}
        </ul>
      )}
      <p className="odds-note">
        This ignores how they bet and assumes nobody else folds. Players who keep betting often hold better than random
        hands, but they could also be drawing or bluffing.
      </p>
    </div>
  );
}
