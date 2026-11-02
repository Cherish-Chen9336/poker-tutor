// The felt table used by the guided hands and the Play screen: the bot at the
// top, the board and pot in the middle, the learner at the bottom.
import { useIntl } from "react-intl";
import type { SeatView, TableView } from "../game/types";
import { useT } from "../i18n/hooks";
import { Card } from "../learn/cards";
import { potText } from "./labels";

function CardBack() {
  const t = useT();
  return <span className="pc md back" role="img" aria-label={t("table.faceDown")} />;
}

function SeatRow({ seat, label, view }: { seat: SeatView; label: string; view: TableView }) {
  const t = useT();
  return (
    <div className={`gseat ${view.actionTo === seat.seat ? "acting" : ""}`}>
      <div className="gseat-info">
        <b>
          {label}
          {view.buttonSeat === seat.seat && (
            <span className="dealer-chip" title={t("table.button")} aria-label={t("table.buttonMark")}>
              D
            </span>
          )}
        </b>
        <span className="mono">{t("table.chips", { amount: String(seat.stack) })}</span>
        {seat.betThisStreet > 0 && <span className="gbet">{t("table.bet", { amount: String(seat.betThisStreet) })}</span>}
        {seat.status === "folded" && <span className="gbet">{t("table.folded")}</span>}
        {seat.status === "all-in" && <span className="gbet">{t("table.allIn")}</span>}
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
  const t = useT();
  const intl = useIntl();
  const you = view.seats[youSeat]!;
  const bot = view.seats[1 - youSeat]!;
  return (
    <div className="gtable" aria-label={t("table.label")}>
      <SeatRow seat={bot} label={t("table.bot")} view={view} />
      <div className="gboard">
        <span className="pc-row" aria-label={view.board.length ? t("table.board") : t("table.noBoard")}>
          {Array.from({ length: 5 }, (_, i) =>
            view.board[i] ? <Card key={view.board[i]} code={view.board[i]} /> : <span key={i} className="slot md" />,
          )}
        </span>
        <span className="gpot mono">{potText(intl, view, youSeat)}</span>
      </div>
      <SeatRow seat={you} label={t("table.you")} view={view} />
    </div>
  );
}
