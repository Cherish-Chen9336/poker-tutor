// Lesson diagrams, drawn in code. Each one has a text equivalent (a caption
// or a label) so it works without seeing it.
import { useId, useState } from "react";
import { bestFive } from "../game/hands";
import { Card, Cards } from "./cards";
import { RANK_LADDER, SEAT_LAYOUTS } from "./diagram-data";

/** Lesson 1: the four betting rounds and how the board grows. */
export function StreetTimeline() {
  const board = ["Ad", "8c", "4s", "9h", "2c"];
  const steps = [
    { name: "Preflop", shown: 0, note: "2 private cards each" },
    { name: "Flop", shown: 3, note: "3 shared cards" },
    { name: "Turn", shown: 4, note: "a 4th shared card" },
    { name: "River", shown: 5, note: "the 5th shared card" },
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
            <span className="t-bet">then a betting round</span>
          </li>
        ))}
        <li className="t-end">
          <span className="t-name">Showdown</span>
          <span className="t-note">if 2 or more players are still in</span>
        </li>
      </ol>
      <figcaption>The board grows from 0 to 3, 4, then 5 shared cards, with a betting round after each deal.</figcaption>
    </figure>
  );
}

const BEST_FIVE_ROWS = [
  { label: "Both cards", hole: ["5c", "5d"], board: ["5h", "Kd", "9c", "2s", "3d"], result: "Three fives" },
  { label: "One card", hole: ["Ah", "3c"], board: ["Kh", "9h", "6h", "2h", "Ts"], result: "A flush in hearts" },
  { label: "No cards", hole: ["Js", "Jd"], board: ["As", "Ad", "Kc", "Kh", "Qs"], result: "A-A-K-K-Q, all from the board" },
];

/** Lesson 2: which 5 of the 7 cards count. The highlight is computed, not typed in. */
export function BestFiveRows() {
  return (
    <figure className="diagram">
      <div className="best5">
        {BEST_FIVE_ROWS.map((row) => {
          const lit = bestFive([...row.hole, ...row.board]);
          return (
            <div key={row.label} className="best5-row">
              <span className="best5-label">{row.label}</span>
              <span className="best5-cards">
                <span className="group">
                  <span className="group-label">Your cards</span>
                  <Cards codes={row.hole} size="sm" lit={lit} />
                </span>
                <span className="group">
                  <span className="group-label">Board</span>
                  <Cards codes={row.board} size="sm" lit={lit} />
                </span>
              </span>
              <span className="best5-result">{row.result}</span>
            </div>
          );
        })}
      </div>
      <figcaption>Highlighted cards make the best 5. Faded cards don't count.</figcaption>
    </figure>
  );
}

/** Lesson 3: the ten hands, strongest first. */
export function RankLadder() {
  return (
    <figure className="diagram">
      <ol className="ladder">
        {RANK_LADDER.map((row, i) => (
          <li key={row.name}>
            <span className="ladder-n" aria-hidden="true">{i + 1}</span>
            <span className="ladder-text">
              <b>{row.name}</b>
              <span>{row.meaning}</span>
            </span>
            <Cards codes={row.cards} size="sm" />
          </li>
        ))}
      </ol>
      <figcaption>Strongest at the top. Each hand beats every hand below it.</figcaption>
    </figure>
  );
}

/** Lesson 4: who sits where and the order of play, before and after the flop. */
export function SeatMap() {
  const [players, setPlayers] = useState(6);
  const [street, setStreet] = useState<"preflop" | "postflop">("preflop");
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
  const short = (label: string) =>
    label.startsWith("Button") ? "BTN" : label === "Small blind" ? "SB" : label === "Big blind" ? "BB" : label.replace("Seat ", "S");
  const spoken = order.map((seat) => layout.labels[seat]).join(", then ");

  return (
    <figure className="diagram seatmap">
      <div className="seg-row">
        <div className="seg" role="group" aria-label="Players">
          {[6, 2].map((n) => (
            <button key={n} type="button" aria-pressed={players === n} onClick={() => setPlayers(n)}>
              {n === 6 ? "6 players" : "Heads-up"}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Betting round">
          {(["preflop", "postflop"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={street === s} onClick={() => setStreet(s)}>
              {s === "preflop" ? "Before the flop" : "After the flop"}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 -30 400 320" role="img" aria-labelledby={id}>
        <title id={id}>{`${players === 6 ? "6 players" : "Heads-up"}, ${street === "preflop" ? "before the flop" : "after the flop"}: ${spoken}.`}</title>
        <ellipse cx={cx} cy={cy} rx="150" ry="86" className="felt-rail" />
        <ellipse cx={cx} cy={cy} rx="138" ry="75" className="felt" />
        <text x={cx} y={cy - 6} className="felt-text">Order of play</text>
        <text x={cx} y={cy + 14} className="felt-sub">{street === "preflop" ? "before the flop" : "flop, turn, river"}</text>
        {layout.labels.map((label, seat) => {
          const { x, y } = position(seat);
          const turn = order.indexOf(seat) + 1;
          return (
            <g key={seat} transform={`translate(${x} ${y})`}>
              <circle r="21" className={seat === 0 ? "seat-dot btn" : "seat-dot"} />
              <text y="5" className="seat-num">{turn}</text>
              <text y={y > cy ? 36 : -28} className="seat-label">{short(label)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        Numbers show who acts 1st, 2nd, 3rd… <b>Order:</b> {spoken}. BTN is the button, SB the small blind, BB the big blind.
      </figcaption>
    </figure>
  );
}

/** Lesson 5: "raise to 6" vs. "raise by 4". */
export function RaiseToBy() {
  return (
    <figure className="diagram">
      <div className="bars" aria-hidden="true">
        <div className="bar-row">
          <span className="bar-label">Big blind</span>
          <span className="bar-track"><span className="seg-a" style={{ width: "33.3%" }}>2</span></span>
        </div>
        <div className="bar-row">
          <span className="bar-label">You raise to 6</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "33.3%" }}>2</span>
            <span className="seg-b" style={{ width: "66.7%" }}>+4 the raise</span>
          </span>
        </div>
      </div>
      <figcaption>The big blind is 2. Raising to 6 means 6 in total, which is 4 more: you raised by 4.</figcaption>
    </figure>
  );
}

/** Lesson 6: calling all-in for less than the bet. */
export function AllInRefund() {
  return (
    <figure className="diagram">
      <div className="bars" aria-hidden="true">
        <div className="bar-row">
          <span className="bar-label">Opponent bets 100</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "30%" }}>30 into the pot</span>
            <span className="seg-c" style={{ width: "70%" }}>70 goes back</span>
          </span>
        </div>
        <div className="bar-row">
          <span className="bar-label">You call all-in</span>
          <span className="bar-track"><span className="seg-a" style={{ width: "30%" }}>30</span></span>
        </div>
      </div>
      <figcaption>You can only win as much from your opponent as you put in. Your 30 matches 30 of their bet; the other 70 is returned.</figcaption>
    </figure>
  );
}

/** Lesson 7: two pairs of aces, decided by the kicker. */
export function KickerCompare() {
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
      <span className={won ? "kick-result good" : "kick-result"}>{won ? "✓ Wins: king kicker" : "Queen kicker"}</span>
    </div>
  );
  return (
    <figure className="diagram">
      {row("You", you, "Kd", true)}
      {row("Opponent", them, "Qh", false)}
      <figcaption>Both have a pair of aces. Comparing the next-highest cards, the king beats the queen.</figcaption>
    </figure>
  );
}
