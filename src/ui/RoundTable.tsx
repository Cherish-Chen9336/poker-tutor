// The six-seat table, in the design preview's style: an oval felt with seats
// clockwise from the learner at the bottom, each player's bet in front of
// them, the dealer button, and the board with its pots in the middle.
import { POSITION_NAMES, positionOf } from "../game/positions";
import type { SeatView, TableView } from "../game/types";
import { Card } from "../learn/cards";
import { potLabel } from "./labels";

function Back() {
  return <span className="pc sm back" role="img" aria-label="Face-down card" />;
}

/** While betting goes on and there's more than one pot: each pot and how many players can win it. */
function pots(view: TableView): string[] {
  if (view.handOver || view.pots.length <= 1) return [];
  return view.pots.map((pot, i) => {
    const name = i === 0 ? "Main pot" : view.pots.length > 2 ? `Side pot ${i}` : "Side pot";
    return `${name} ${pot.amount} · ${pot.eligibleSeats.length} players`;
  });
}

function Seat({ seat, view, youSeat, names }: { seat: SeatView; view: TableView; youSeat: number; names: string[] }) {
  const you = seat.seat === youSeat;
  const position = positionOf(view, seat.seat);
  const acting = view.actionTo === seat.seat;
  const won = (view.winners ?? []).filter((w) => w.seat === seat.seat).reduce((sum, w) => sum + w.amount, 0);
  const status = seat.status === "folded" ? "folded" : seat.status === "all-in" ? "all-in" : "";
  const label = [
    you ? "You" : names[seat.seat],
    POSITION_NAMES[position],
    `${seat.stack} chips`,
    seat.betThisStreet ? `bet ${seat.betThisStreet}` : "",
    status,
    acting ? "to act" : "",
    won ? `won ${won}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div className={`rt-seat p${(seat.seat - youSeat + view.seats.length) % view.seats.length} ${you ? "you" : ""} ${status} ${acting ? "acting" : ""} ${won ? "winner" : ""}`} aria-label={label}>
      <div className="rt-hand" aria-hidden={!seat.cards?.some(Boolean)}>
        {seat.status === "folded"
          ? null
          : seat.cards
            ? seat.cards.map((c, i) => (c ? <Card key={c} code={c} size={you ? "md" : "sm"} /> : <Back key={i} />))
            : [<Back key="a" />, <Back key="b" />]}
      </div>
      <div className="rt-plate">
        <span className="rt-name">{you ? "You" : names[seat.seat]}</span>
        <span className="rt-pos" title={POSITION_NAMES[position]}>
          {position}
        </span>
        <span className="rt-stack mono">{seat.stack}</span>
      </div>
      {(status || won > 0) && <span className="rt-status">{won ? `won ${won}` : status}</span>}
    </div>
  );
}

export function RoundTable({ view, youSeat, names }: { view: TableView; youSeat: number; names: string[] }) {
  const n = view.seats.length;
  const place = (seat: number) => (seat - youSeat + n) % n;
  return (
    <div className="rt-wrap">
      <div className="rt-felt" aria-label="Table">
        <div className="rt-center">
          <span className="pc-row" aria-label={view.board.length ? "Board" : "No board cards yet"}>
            {Array.from({ length: 5 }, (_, i) =>
              view.board[i] ? <Card key={view.board[i]} code={view.board[i]} /> : <span key={i} className="slot md" />,
            )}
          </span>
          <span className="gpot mono">{potLabel(view, youSeat, names)}</span>
          {pots(view).map((p) => (
            <span key={p} className="rt-sidepot mono">
              {p}
            </span>
          ))}
        </div>
        {view.seats.map((s) =>
          s && s.betThisStreet > 0 ? (
            <span key={`bet${s.seat}`} className={`rt-bet p${place(s.seat)}`} aria-hidden="true">
              <span className="chip" />
              {s.betThisStreet}
            </span>
          ) : null,
        )}
        {view.buttonSeat !== null && (
          <span className={`rt-dealer p${place(view.buttonSeat)}`} title="Button" aria-hidden="true">
            D
          </span>
        )}
        {view.seats.map((s) => (s ? <Seat key={s.seat} seat={s} view={view} youSeat={youSeat} names={names} /> : null))}
      </div>
    </div>
  );
}
