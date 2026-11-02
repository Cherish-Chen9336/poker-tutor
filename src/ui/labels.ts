import type { IntlShape } from "react-intl";
import { potTotal } from "../game/pot-math";
import { en, type MessageId } from "../i18n/messages/en";
import type { TableView } from "../game/types";

/**
 * Says what's in the pot, or, once the hand is over, who won it. `names` gives
 * each seat's name at a six-player table; heads-up, the other player is "the bot".
 */
export function potLabel(view: TableView, youSeat: number, names?: string[]): string {
  if (!view.handOver) return `Pot ${potTotal(view)}`;
  const name = (seat: number, start: boolean) => (seat === youSeat ? "You" : (names?.[seat] ?? (start ? "The bot" : "the bot")));
  const pots = view.potResults;
  if (pots && pots.length > 1) {
    const winners = new Set(pots.flatMap((p) => p.winners.map((w) => w.seat)));
    const total = pots.reduce((sum, p) => sum + p.amount, 0);
    if (winners.size === 1) return `${name([...winners][0], true)} won all ${pots.length} pots (${total})`;
    return pots
      .map((p, i) => `${i === 0 ? "Main" : "Side"}: ${p.winners.map((w) => `${name(w.seat, false)} ${w.amount}`).join(" + ")}`)
      .join(" · ");
  }
  const winners = pots?.[0]?.winners ?? (view.winners ?? []).map((w) => ({ seat: w.seat, amount: w.amount }));
  if (winners.length > 1) return `Split pot: ${winners.map((w) => w.amount).join(" + ")}`;
  return `${name(winners[0]?.seat ?? -1, true)} won ${winners[0]?.amount ?? 0}`;
}

/** potLabel's words in any language (potLabel stays as the English reference for tests). */
export function potText(intl: IntlShape, view: TableView, youSeat: number, names?: string[]): string {
  const t = (id: MessageId, values: Record<string, string | number> = {}) =>
    intl.formatMessage({ id, defaultMessage: en[id] }, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  if (!view.handOver) return t("pot.amount", { amount: potTotal(view) });
  const name = (seat: number, start: boolean) => {
    const who = seat === youSeat ? "you" : names?.[seat] ? "player" : "bot";
    return t(start ? "pot.name" : "pot.nameMid", { who, name: names?.[seat] ?? "" });
  };
  const join = (items: string[], id: MessageId) => items.reduce((a, b) => t(id, { a, b }));
  const pots = view.potResults;
  if (pots && pots.length > 1) {
    const winners = new Set(pots.flatMap((p) => p.winners.map((w) => w.seat)));
    const total = pots.reduce((sum, p) => sum + p.amount, 0);
    if (winners.size === 1) return t("pot.wonAll", { name: name([...winners][0], true), pots: pots.length, total });
    return join(
      pots.map((p, i) =>
        t("pot.part", {
          pot: i === 0 ? "main" : "side",
          winners: join(
            p.winners.map((w) => t("pot.winner", { name: name(w.seat, false), amount: w.amount })),
            "pot.plus",
          ),
        }),
      ),
      "pot.dot",
    );
  }
  const winners = pots?.[0]?.winners ?? (view.winners ?? []).map((w) => ({ seat: w.seat, amount: w.amount }));
  if (winners.length > 1) return t("pot.split", { amounts: join(winners.map((w) => String(w.amount)), "pot.plus") });
  return t("pot.won", { name: name(winners[0]?.seat ?? -1, true), amount: winners[0]?.amount ?? 0 });
}
