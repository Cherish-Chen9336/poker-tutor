// Lesson diagrams, drawn in code. Each one has a text equivalent (a caption
// or a label) so it works without seeing it.
import { useId, useState } from "react";
import { bestFive } from "../game/hands";
import { useIntl } from "react-intl";
import { useT } from "../i18n/hooks";
import { en, type MessageId } from "../i18n/messages/en";
import { C, Card, Cards } from "./cards";
import { formatPercent, oneInNumber, RANK_LADDER, SEAT_LAYOUTS, SEVEN_CARD_TOTAL } from "./diagram-data";

/** Lesson 1: the four betting rounds and how the board grows. */
export function StreetTimeline() {
  const t = useT();
  const board = ["Ad", "8c", "4s", "9h", "2c"];
  const steps = [
    { name: t("timeline.preflop"), shown: 0, note: t("timeline.preflopNote") },
    { name: t("timeline.flop"), shown: 3, note: t("timeline.flopNote") },
    { name: t("timeline.turn"), shown: 4, note: t("timeline.turnNote") },
    { name: t("timeline.river"), shown: 5, note: t("timeline.riverNote") },
  ];
  return (
    <figure className="diagram">
      <ol className="timeline">
        {steps.map((step) => (
          <li key={step.name}>
            <span className="t-name">{step.name}</span>
            <span className="t-board" aria-hidden="true">
              {board.map((code, i) => (i < step.shown ? <Card key={code} code={code} size="sm" /> : <span key={code} className="slot sm" />))}
            </span>
            <span className="t-note">{step.note}</span>
            <span className="t-bet">{t("timeline.bet")}</span>
          </li>
        ))}
        <li className="t-end">
          <span className="t-name">{t("timeline.showdown")}</span>
          <span className="t-note">{t("timeline.showdownNote")}</span>
        </li>
      </ol>
      <p className="t-fold">{t("timeline.fold")}</p>
      <figcaption>{t("timeline.caption")}</figcaption>
    </figure>
  );
}

const BEST_FIVE_ROWS: { label: MessageId; hole: string[]; board: string[]; result: MessageId; cards: string[] }[] = [
  { label: "best5.uses2", hole: ["5c", "5d"], board: ["5h", "Kd", "9c", "2s", "3d"], result: "best5.result2", cards: ["5c", "5d", "5h"] },
  { label: "best5.uses1", hole: ["Ah", "3c"], board: ["Kh", "9h", "6h", "2h", "Ts"], result: "best5.result1", cards: ["Ah", "3c"] },
  { label: "best5.uses0", hole: ["Js", "Jd"], board: ["As", "Ad", "Kc", "Kh", "Qs"], result: "best5.result0", cards: ["3c", "2d"] },
];

/** Cards for a message's {c1}, {c2}… values. */
function cardValues(codes: string[]) {
  return Object.fromEntries(codes.map((code, i) => [`c${i + 1}`, <C key={code} c={code} />]));
}

/** Lesson 2: which 5 of the 7 cards count. The highlight is computed, not typed in. */
export function BestFiveRows() {
  const t = useT();
  return (
    <figure className="diagram">
      <div className="best5">
        {BEST_FIVE_ROWS.map((row) => {
          const lit = bestFive([...row.hole, ...row.board]);
          return (
            <div key={row.label} className="best5-row">
              <span className="best5-label">{t(row.label)}</span>
              <span className="best5-cards">
                <span className="group">
                  <span className="group-label">{t("best5.yourCards")}</span>
                  <Cards codes={row.hole} size="sm" lit={lit} />
                </span>
                <span className="group">
                  <span className="group-label">{t("best5.board")}</span>
                  <Cards codes={row.board} size="sm" lit={lit} />
                </span>
              </span>
              <span className="best5-result">{t(row.result, cardValues(row.cards))}</span>
            </div>
          );
        })}
      </div>
      <figcaption>{t("best5.caption")}</figcaption>
    </figure>
  );
}

/** The ladder's rows, strongest first, by their message ids. */
const LADDER_IDS = ["royalFlush", "straightFlush", "fourOfAKind", "fullHouse", "flush", "straight", "threeOfAKind", "twoPair", "onePair", "highCard"] as const;

/** Lesson 3: the ten hands, strongest first, with how often 7 cards make each. */
export function RankLadder() {
  const t = useT();
  const most = Math.max(...RANK_LADDER.map((row) => row.sevenCardCount));
  return (
    <figure className="diagram">
      <div className="ladder-head" aria-hidden="true">
        <span>{t("ladder.head")}</span>
      </div>
      <ol className="ladder">
        {RANK_LADDER.map((row, i) => (
          <li key={row.name}>
            <span className="ladder-n" aria-hidden="true">{i + 1}</span>
            <span className="ladder-text">
              <b>{t(`hand.${LADDER_IDS[i]}`)}</b>
              <span>{t(`hand.${LADDER_IDS[i]}.meaning`)}</span>
            </span>
            <Cards codes={row.cards} size="sm" />
            <span className="ladder-odds">
              <span className="pct">{formatPercent(row.sevenCardCount, SEVEN_CARD_TOTAL)}</span>
              <span className="one-in">{t("ladder.oneIn", { n: oneInNumber(row.sevenCardCount, SEVEN_CARD_TOTAL) })}</span>
              <span className="odds-bar" aria-hidden="true">
                <i style={{ width: `${(row.sevenCardCount / most) * 100}%` }} />
              </span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption>{t("ladder.caption")}</figcaption>
    </figure>
  );
}

/** Seat label ids by the data's English labels. */
const SEAT_IDS: Record<string, { short: string; name: MessageId }> = {
  Button: { short: "BTN", name: "seatName.BTN" },
  "Button (small blind)": { short: "BTN", name: "seatName.BTNSB" },
  "Small blind": { short: "SB", name: "seatName.SB" },
  "Big blind": { short: "BB", name: "seatName.BB" },
  "Under the gun": { short: "UTG", name: "seatName.UTG" },
  Hijack: { short: "HJ", name: "seatName.HJ" },
  Cutoff: { short: "CO", name: "seatName.CO" },
};

/** Lesson 4: who sits where and the order of play, before and after the flop. */
export function SeatMap({ initialPlayers = 6, initialStreet = "preflop" }: { initialPlayers?: 2 | 6; initialStreet?: "preflop" | "postflop" }) {
  const t = useT();
  const intl = useIntl();
  const [players, setPlayers] = useState<number>(initialPlayers);
  const [street, setStreet] = useState<"preflop" | "postflop">(initialStreet);
  const layout = SEAT_LAYOUTS.find((l) => l.players === players)!;
  const order = layout[street];
  const id = useId();
  const cx = 200;
  const cy = 130;
  const position = (seat: number) => {
    // Clockwise from the bottom (seat 0), which is "to the left" at a poker table.
    const angle = Math.PI / 2 + (seat * 2 * Math.PI) / layout.players;
    return { x: cx + 165 * Math.cos(angle), y: cy + 100 * Math.sin(angle) };
  };
  const name = (seat: number) => intl.formatMessage({ id: SEAT_IDS[layout.labels[seat]].name, defaultMessage: en[SEAT_IDS[layout.labels[seat]].name] });
  // An arrow along the bottom of the felt, right to left: play moves clockwise ("to the left").
  const arc = (deg: number) => ({ x: cx + 118 * Math.cos((deg * Math.PI) / 180), y: cy + 56 * Math.sin((deg * Math.PI) / 180) });
  const [arcFrom, arcTo] = [arc(62), arc(118)];
  const arrowId = `${id.replace(/[^\w-]/g, "")}-arrow`; // useId's colons would break url(#…)
  const spoken = order
    .map(name)
    .reduce((first, next) => intl.formatMessage({ id: "seatMap.then", defaultMessage: en["seatMap.then"] }, { first, next }));
  // Long seat names (such as Japanese スモールブラインド) would run off the sides, so the drawing widens to fit them.
  // Widths are estimated at the largest name size (17): a CJK character is about one em, others about half.
  const nameWidth = (text: string) => [...text].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 17 : 9.5), 0);
  const pad = Math.ceil(
    Math.max(0, ...layout.labels.map((_, seat) => nameWidth(name(seat)) / 2 + 4 - Math.min(position(seat).x, 400 - position(seat).x))),
  );
  const title = intl.formatMessage(
    { id: "seatMap.title", defaultMessage: en["seatMap.title"] },
    { players: players === 6 ? "six" : "two", street, order: spoken },
  );

  return (
    <figure className="diagram seatmap">
      <div className="seg-row">
        <div className="seg" role="group" aria-label={t("seatMap.players")}>
          {[6, 2].map((n) => (
            <button key={n} type="button" aria-pressed={players === n} onClick={() => setPlayers(n)}>
              {n === 6 ? t("seatMap.six") : t("seatMap.headsUp")}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t("seatMap.round")}>
          {(["preflop", "postflop"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={street === s} onClick={() => setStreet(s)}>
              {s === "preflop" ? t("seatMap.preflop") : t("seatMap.postflop")}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`${-pad} -50 ${400 + 2 * pad} 350`} role="img" aria-labelledby={id}>
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="seat-arrow-head" />
          </marker>
        </defs>
        <title id={id}>{title}</title>
        <ellipse cx={cx} cy={cy} rx="150" ry="86" className="felt-rail" />
        <ellipse cx={cx} cy={cy} rx="138" ry="75" className="felt" />
        <text x={cx} y={cy - 6} className="felt-text">{t("seatMap.felt")}</text>
        <text x={cx} y={cy + 14} className="felt-sub">{street === "preflop" ? t("seatMap.feltPreflop") : t("seatMap.feltPostflop")}</text>
        <path d={`M${arcFrom.x} ${arcFrom.y} A118 56 0 0 1 ${arcTo.x} ${arcTo.y}`} className="seat-arrow" markerEnd={`url(#${arrowId})`} />
        <text x={cx} y={cy + 48} className="felt-hint">{t("seatMap.clockwise")}</text>
        {layout.labels.map((label, seat) => {
          const { x, y } = position(seat);
          const turn = order.indexOf(seat) + 1;
          const below = y > cy;
          return (
            <g key={seat} transform={`translate(${x} ${y})`}>
              <circle r="21" className={seat === 0 ? "seat-dot btn" : "seat-dot"} />
              <text y="5" className="seat-num">{turn}</text>
              <text y={below ? 38 : -30} className="seat-label">{SEAT_IDS[label].short}</text>
              <text y={below ? 58 : -51} className="seat-name">{name(seat)}</text>
              {seat === 0 && (
                <g transform="translate(25 -17)">
                  <circle r="10" className="seat-dealer" />
                  <text y="4" className="seat-dealer-text">D</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption>{t("seatMap.caption", { order: spoken })}</figcaption>
    </figure>
  );
}

/** Lesson 5: "raise to 6" vs. "raise by 4". */
export function RaiseToBy() {
  const t = useT();
  return (
    <figure className="diagram">
      <div className="bars" aria-hidden="true">
        <div className="bar-row">
          <span className="bar-label">{t("raiseBars.bb")}</span>
          <span className="bar-track"><span className="seg-a" style={{ width: "20%" }}>2</span></span>
        </div>
        <div className="bar-row">
          <span className="bar-label">{t("raiseBars.you")}</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "20%" }}>2</span>
            <span className="seg-b" style={{ width: "40%" }}>{t("raiseBars.theRaise")}</span>
          </span>
        </div>
        <div className="bar-row">
          <span className="bar-label">{t("raiseBars.next")}</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "60%" }}>6</span>
            <span className="seg-b" style={{ width: "40%" }}>{t("raiseBars.orMore")}</span>
          </span>
        </div>
      </div>
      <figcaption>{t("raiseBars.caption")}</figcaption>
    </figure>
  );
}

/** Lesson 6: calling all-in for less than the bet. */
export function AllInRefund() {
  const t = useT();
  const steps = [t("refund.step1"), t("refund.step2"), t("refund.step3")];
  return (
    <figure className="diagram">
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={i}>
            <span className="step-num" aria-hidden="true">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="bars" aria-hidden="true">
        <div className="bar-row">
          <span className="bar-label">{t("refund.theirs")}</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "30%" }}>30</span>
            <span className="seg-c" style={{ width: "70%" }}>{t("refund.back")}</span>
          </span>
        </div>
        <div className="bar-row">
          <span className="bar-label">{t("refund.yours")}</span>
          <span className="bar-track"><span className="seg-a" style={{ width: "30%" }}>30</span></span>
        </div>
      </div>
    </figure>
  );
}

/** Lesson 7: two pairs of aces, decided by the kicker. */
export function KickerCompare() {
  const t = useT();
  const board = ["Ad", "8c", "4s", "9h", "2c"];
  const you = bestFive(["As", "Kd", ...board]);
  const them = bestFive(["Ac", "Qh", ...board]);
  const order = (cards: string[]) => [...cards].sort((a, b) => "23456789TJQKA".indexOf(b[0]) - "23456789TJQKA".indexOf(a[0]));
  const row = (label: string, cards: string[], decider: string, won: boolean) => (
    <div className="kick-row">
      <span className="kick-label">{label}</span>
      <span className="pc-row">
        {order(cards).map((code) => (
          <Card key={code} code={code} size="sm" lit={code === decider} />
        ))}
      </span>
      <span className={won ? "kick-result good" : "kick-result"}>{won ? t("kicker.wins") : t("kicker.queen")}</span>
    </div>
  );
  return (
    <figure className="diagram">
      {row(t("kicker.you"), you, "Kd", true)}
      {row(t("kicker.opponent"), them, "Qh", false)}
      <figcaption>{t("kicker.caption")}</figcaption>
    </figure>
  );
}

/** Lesson 16: three all-in stacks sliced into the main pot, the side pot, and the returned chips. */
export function SidePotBars() {
  const rows = [
    { name: "A", stack: 30 },
    { name: "B", stack: 80 },
    { name: "C", stack: 100 },
  ];
  const width = (n: number) => `${n}%`;
  return (
    <figure className="diagram">
      <div className="bars" aria-hidden="true">
        {rows.map((r) => (
          <div key={r.name} className="bar-row">
            <span className="bar-label">
              {r.name} puts in {r.stack}
            </span>
            <span className="bar-track">
              <span className="seg-a" style={{ width: width(30) }}>30</span>
              {r.stack > 30 && <span className="seg-b" style={{ width: width(50) }}>50</span>}
              {r.stack > 80 && <span className="seg-c" style={{ width: width(20) }}>20</span>}
            </span>
          </div>
        ))}
      </div>
      <ul className="pot-labels">
        <li>
          <span className="key call" /> <b>Main pot: 30 × 3 = 90.</b> A, B, or C can win it.
        </li>
        <li>
          <span className="key pot" /> <b>Side pot: 50 × 2 = 100.</b> Only B or C can win it.
        </li>
        <li>
          <span className="key returned" /> <b>Returned: 20 to C.</b> Nobody matched it.
        </li>
      </ul>
    </figure>
  );
}
