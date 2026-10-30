// The felt table used by the guided hands and the Play screen: the bot at the
// top, the board and pot in the middle, the learner at the bottom.
import type { SeatView, TableView } from "../game/types";
import { Card } from "../learn/cards";
import { potLabel } from "./labels";

function CardBack() {
  return <span className="pc md back" role="img" aria-label="Face-down card" />;
}

function SeatRow({ seat, label, view }: { seat: SeatView; label: string; view: TableView }) {
  return (
    <div className={`gseat ${view.actionTo === seat.seat ? "acting" : ""}`}>
      <div className="gseat-info">
        <b>
          {label}
          {view.buttonSeat === seat.seat && (
            <span className="dealer-chip" title="Button" aria-label="(button)">
              D
            </span>
          )}
        </b>
        <span className="mono">{seat.stack} chips</span>
        {seat.betThisStreet > 0 && <span className="gbet">bet {seat.betThisStreet}</span>}
        {seat.status === "folded" && <span className="gbet">folded</span>}
        {seat.status === "all-in" && <span className="gbet">all-in</span>}
      </div>
      <span className="pc-row">
        {seat.cards
          ? seat.cards.map((c, i) => (c ? <Card key={c} code={c} /> : <CardBack key={i} />))
          : seat.status === "folded"
            ? null
            : [<CardBack key="a" />, <CardBack key="b" />]}
      </span>
    </div>
  );
}

export function TableFelt({ view, youSeat }: { view: TableView; youSeat: number }) {
  const you = view.seats[youSeat]!;
  const bot = view.seats[1 - youSeat]!;
  return (
    <div className="gtable" aria-label="Table">
      <SeatRow seat={bot} label="Bot" view={view} />
      <div className="gboard">
        <span className="pc-row" aria-label={view.board.length ? "Board" : "No board cards yet"}>
          {Array.from({ length: 5 }, (_, i) =>
            view.board[i] ? <Card key={view.board[i]} code={view.board[i]} /> : <span key={i} className="slot md" />,
          )}
        </span>
        <span className="gpot mono">{potLabel(view, youSeat)}</span>
      </div>
      <SeatRow seat={you} label="You" view={view} />
    </div>
  );
}
