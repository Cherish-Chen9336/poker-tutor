// The six-seat table, in the design preview's style: an oval felt with seats
// clockwise from the learner at the bottom, each player's bet in front of
// them, the dealer button, and the board with its pots in the middle.
import { useIntl } from "react-intl";
import { positionOf } from "../game/positions";
import type { SeatView, TableView } from "../game/types";
import { useT } from "../i18n/hooks";
import { Card } from "../learn/cards";
import { potText } from "./labels";

type T = ReturnType<typeof useT>;

function Back() {
  const t = useT();
  return <span className="pc sm back" role="img" aria-label={t("table.faceDown")} />;
}

/** While betting goes on and there's more than one pot: each pot and who can win it. */
function pots(t: T, view: TableView, youSeat: number, names: string[]): string[] {
  if (view.handOver || view.pots.length <= 1) return [];
  return view.pots.map((pot, i) => {
    // A damaged saved hand can list nobody; that must not crash the table.
    const who = pot.eligibleSeats
      .map((seat) => (seat === youSeat ? t("table.you") : names[seat]))
      .reduce((a, b) => (a ? t("table.join", { a, b }) : b), "");
    const number = i > 0 && view.pots.length > 2 ? ` ${i}` : "";
    return t("table.potLine", { pot: i === 0 ? "main" : "side", number, amount: String(pot.amount), who });
  });
}

function Seat({ seat, view, youSeat, names }: { seat: SeatView; view: TableView; youSeat: number; names: string[] }) {
  const t = useT();
  const you = seat.seat === youSeat;
  const position = positionOf(view, seat.seat);
  const acting = view.actionTo === seat.seat;
  const won = (view.winners ?? []).filter((w) => w.seat === seat.seat).reduce((sum, w) => sum + w.amount, 0);
  const status = seat.status === "folded" ? "folded" : seat.status === "all-in" ? "all-in" : "";
  const statusWords = status === "folded" ? t("table.folded") : status === "all-in" ? t("table.allIn") : "";
  const positionName = t("table.position", { pos: position });
  const label = [
    you ? t("table.you") : names[seat.seat],
    positionName,
    t("table.chips", { amount: String(seat.stack) }),
    seat.betThisStreet ? t("table.bet", { amount: String(seat.betThisStreet) }) : "",
    statusWords,
    acting ? t("table.toAct") : "",
    won ? t("table.won", { amount: String(won) }) : "",
  ]
    .filter(Boolean)
    .reduce((a, b) => t("table.join", { a, b }));
  return (
    <div
      role="group"
      aria-label={label}
      className={`rt-seat p${(seat.seat - youSeat + view.seats.length) % view.seats.length} ${you ? "you" : ""} ${status} ${acting ? "acting" : ""} ${won ? "winner" : ""}`}
    >
      <div className="rt-hand" aria-hidden={!seat.cards?.some(Boolean)}>
        {seat.status === "folded"
          ? null
          : seat.cards
            ? seat.cards.map((c, i) => (c ? <Card key={c} code={c} size={you ? "md" : "sm"} /> : <Back key={i} />))
            : [<Back key="a" />, <Back key="b" />]}
      </div>
      <div className="rt-plate">
        {view.buttonSeat === seat.seat && (
          <span className="rt-dealer" title={t("table.button")} aria-hidden="true">
            D
          </span>
        )}
        <span className="rt-name">{you ? t("table.you") : names[seat.seat]}</span>
        <span className="rt-pos" title={positionName}>
          {position}
        </span>
        <span className="rt-stack mono">{seat.stack}</span>
      </div>
      {(status || won > 0) && <span className="rt-status">{won ? t("table.won", { amount: String(won) }) : statusWords}</span>}
    </div>
  );
}

export function RoundTable({ view, youSeat, names }: { view: TableView; youSeat: number; names: string[] }) {
  const t = useT();
  const intl = useIntl();
  const n = view.seats.length;
  const place = (seat: number) => (seat - youSeat + n) % n;
  const potList = pots(t, view, youSeat, names);
  return (
    <div className="rt">
      <div className="rt-wrap">
        <div className="rt-felt" aria-label={t("table.label")}>
          <div className="rt-center">
            <span className="pc-row" aria-label={view.board.length ? t("table.board") : t("table.noBoard")}>
              {Array.from({ length: 5 }, (_, i) =>
                view.board[i] ? <Card key={view.board[i]} code={view.board[i]} /> : <span key={i} className="slot md" />,
              )}
            </span>
            <span className="gpot mono">{potText(intl, view, youSeat, names)}</span>
          </div>
          {view.seats.map((s) =>
            s && s.betThisStreet > 0 ? (
              <span key={`bet${s.seat}`} className={`rt-bet p${place(s.seat)}`} aria-hidden="true">
                <span className="chip" />
                {s.betThisStreet}
              </span>
            ) : null,
          )}
          {view.seats.map((s) => (s ? <Seat key={s.seat} seat={s} view={view} youSeat={youSeat} names={names} /> : null))}
        </div>
      </div>
      {/* Pot details go below the table, so long lists never push the board into the seats. */}
      {potList.length > 0 && (
        <ul className="rt-pots" aria-label={t("table.pots")}>
          {potList.map((p) => (
            <li key={p} className="mono">
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
