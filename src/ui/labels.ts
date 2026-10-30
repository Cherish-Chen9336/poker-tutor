import { potTotal } from "../game/pot-math";
import type { TableView } from "../game/types";

/** Says what's in the pot, or, once the hand is over, who won it. */
export function potLabel(view: TableView, youSeat: number): string {
  if (!view.handOver) return `Pot ${potTotal(view)}`;
  const winners = view.winners ?? [];
  if (winners.length > 1) return `Split pot: ${winners.map((w) => w.amount).join(" + ")}`;
  return `${winners[0]?.seat === youSeat ? "You won" : "The bot won"} ${winners[0]?.amount ?? 0}`;
}
