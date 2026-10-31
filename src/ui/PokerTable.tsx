// The table for any number of players: the two-row felt heads-up, the round table otherwise.
import type { TableView } from "../game/types";
import { RoundTable } from "./RoundTable";
import { TableFelt } from "./TableFelt";

export function PokerTable({ view, youSeat, names }: { view: TableView; youSeat: number; names: string[] }) {
  return view.seats.length > 2 ? <RoundTable view={view} youSeat={youSeat} names={names} /> : <TableFelt view={view} youSeat={youSeat} />;
}
