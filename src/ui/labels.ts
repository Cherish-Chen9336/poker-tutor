import { potTotal } from "../game/pot-math";
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
