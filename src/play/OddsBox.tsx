// The coach's win-odds estimate: the learner's share of the pot against
// random hands, with its assumptions. It describes; it never advises.
import type { Equity } from "../game/equity";
import { useT } from "../i18n/hooks";
import type { EquityState } from "./useEquity";

export function OddsBox({ estimates }: { estimates: EquityState[] }) {
  const t = useT();
  const amount = (equity: Equity) => {
    if (equity.exact) return `${(equity.share * 100).toFixed(1)}%`;
    const margin = Math.max(1, Math.round(equity.margin * 100));
    return t("odds.about", { pct: String(Math.round(equity.share * 100)), margin: String(margin) });
  };
  const hands = (n: number) => t("odds.hands", { n: String(n) });
  const single = estimates.length === 1;
  return (
    <div className="odds-box" aria-live="polite">
      <b className="odds-title">{t("odds.title")}</b>
      {single ? (
        <p>
          {t("odds.single", {
            hands: hands(estimates[0].request.opponents),
            amount: estimates[0].equity ? amount(estimates[0].equity) : "…",
          })}
        </p>
      ) : (
        <ul>
          {estimates.map(({ request, equity }) => (
            <li key={request.label}>
              {t("odds.pot", {
                pot: t("odds.potName", { pot: request.pot.kind === "side" ? "side" : "main", number: String(request.pot.number ?? "") }),
                hands: hands(request.opponents),
                amount: equity ? amount(equity) : "…",
              })}
            </li>
          ))}
        </ul>
      )}
      <p className="odds-note">{t("odds.note")}</p>
    </div>
  );
}
