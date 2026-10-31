// Lesson diagrams, drawn in code. Each one has a text equivalent (a caption
// or a label) so it works without seeing it.
import { useId, useState, type ReactNode } from "react";
import { bestFive } from "../game/hands";
import { C, Card, Cards } from "./cards";
import { formatOneIn, formatPercent, RANK_LADDER, SEAT_LAYOUTS, SEVEN_CARD_TOTAL } from "./diagram-data";

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
      <p className="t-fold">
        <b>Everyone else folds</b> → the hand ends at once, with no more cards.
      </p>
      <figcaption>The board grows from 0 to 3, 4, then 5 shared cards, with a betting round after each deal.</figcaption>
    </figure>
  );
}

const BEST_FIVE_ROWS: { label: string; hole: string[]; board: string[]; result: ReactNode }[] = [
  {
    label: "Uses 2 private cards",
    hole: ["5c", "5d"],
    board: ["5h", "Kd", "9c", "2s", "3d"],
    result: (
      <>
        Three fives (<C c="5c" /> <C c="5d" /> <C c="5h" />, plus K and 9).
      </>
    ),
  },
  {
    label: "Uses 1 private card",
    hole: ["Ah", "3c"],
    board: ["Kh", "9h", "6h", "2h", "Ts"],
    result: (
      <>
        A flush in hearts (<C c="Ah" /> plus the board's four hearts). Your <C c="3c" /> doesn't count.
      </>
    ),
  },
  {
    label: "Uses 0 private cards",
    hole: ["Js", "Jd"],
    board: ["As", "Ad", "Kc", "Kh", "Qs"],
    result: (
      <>
        A-A-K-K-Q, all from the board. Your jacks don't play, so an opponent holding <C c="3c" /> <C c="2d" /> has the
        same hand and you split the pot.
      </>
    ),
  },
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

/** Lesson 3: the ten hands, strongest first, with how often 7 cards make each. */
export function RankLadder() {
  const most = Math.max(...RANK_LADDER.map((row) => row.sevenCardCount));
  return (
    <figure className="diagram">
      <div className="ladder-head" aria-hidden="true">
        <span>How often (7 cards)</span>
      </div>
      <ol className="ladder">
        {RANK_LADDER.map((row, i) => (
          <li key={row.name}>
            <span className="ladder-n" aria-hidden="true">{i + 1}</span>
            <span className="ladder-text">
              <b>{row.name}</b>
              <span>{row.meaning}</span>
            </span>
            <Cards codes={row.cards} size="sm" />
            <span className="ladder-odds">
              <span className="pct">{formatPercent(row.sevenCardCount, SEVEN_CARD_TOTAL)}</span>
              <span className="one-in">{formatOneIn(row.sevenCardCount, SEVEN_CARD_TOTAL)}</span>
              <span className="odds-bar" aria-hidden="true">
                <i style={{ width: `${(row.sevenCardCount / most) * 100}%` }} />
              </span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption>
        Strongest at the top. Each hand beats every hand below it. The bars compare how often 7 cards make each hand.
      </figcaption>
    </figure>
  );
}

/** Lesson 4: who sits where and the order of play, before and after the flop. */
export function SeatMap({ initialPlayers = 6 }: { initialPlayers?: 2 | 6 }) {
  const [players, setPlayers] = useState<number>(initialPlayers);
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
  const SHORT: Record<string, string> = { "Small blind": "SB", "Big blind": "BB", "Under the gun": "UTG", Hijack: "HJ", Cutoff: "CO" };
  const short = (label: string) => (label.startsWith("Button") ? "BTN" : (SHORT[label] ?? label));
  // An arrow along the bottom of the felt, right to left: play moves clockwise ("to the left").
  const arc = (deg: number) => ({ x: cx + 118 * Math.cos((deg * Math.PI) / 180), y: cy + 56 * Math.sin((deg * Math.PI) / 180) });
  const [arcFrom, arcTo] = [arc(62), arc(118)];
  const arrowId = `${id.replace(/[^\w-]/g, "")}-arrow`; // useId's colons would break url(#…)
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
      <svg viewBox="0 -50 400 350" role="img" aria-labelledby={id}>
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="seat-arrow-head" />
          </marker>
        </defs>
        <title id={id}>{`${players === 6 ? "6 players" : "Heads-up"}, ${street === "preflop" ? "before the flop" : "after the flop"}: ${spoken}.`}</title>
        <ellipse cx={cx} cy={cy} rx="150" ry="86" className="felt-rail" />
        <ellipse cx={cx} cy={cy} rx="138" ry="75" className="felt" />
        <text x={cx} y={cy - 6} className="felt-text">Order of play</text>
        <text x={cx} y={cy + 14} className="felt-sub">{street === "preflop" ? "before the flop" : "flop, turn, river"}</text>
        <path d={`M${arcFrom.x} ${arcFrom.y} A118 56 0 0 1 ${arcTo.x} ${arcTo.y}`} className="seat-arrow" markerEnd={`url(#${arrowId})`} />
        <text x={cx} y={cy + 48} className="felt-hint">clockwise</text>
        {layout.labels.map((label, seat) => {
          const { x, y } = position(seat);
          const turn = order.indexOf(seat) + 1;
          const below = y > cy;
          return (
            <g key={seat} transform={`translate(${x} ${y})`}>
              <circle r="21" className={seat === 0 ? "seat-dot btn" : "seat-dot"} />
              <text y="5" className="seat-num">{turn}</text>
              <text y={below ? 38 : -30} className="seat-label">{short(label)}</text>
              <text y={below ? 58 : -51} className="seat-name">{label}</text>
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
      <figcaption>
        Numbers show the first order of play (1st, 2nd, 3rd…), assuming everyone can act; a raise gives players facing it
        another turn. Switch the betting round to compare. <b>Order:</b> {spoken}. The seats are
        named clockwise from the button (marked D).
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
          <span className="bar-track"><span className="seg-a" style={{ width: "20%" }}>2</span></span>
        </div>
        <div className="bar-row">
          <span className="bar-label">You raise to 6</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "20%" }}>2</span>
            <span className="seg-b" style={{ width: "40%" }}>+4 the raise</span>
          </span>
        </div>
        <div className="bar-row">
          <span className="bar-label">Next full raise</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "60%" }}>6</span>
            <span className="seg-b" style={{ width: "40%" }}>+4 or more</span>
          </span>
        </div>
      </div>
      <figcaption>
        The big blind is 2. Raising to 6 means 6 in total, which is 4 more: you raised by 4. The next full raise must add
        at least 4 again, so it's to at least 10 (6 + 4).
      </figcaption>
    </figure>
  );
}

/** Lesson 6: calling all-in for less than the bet. */
export function AllInRefund() {
  const steps = [
    "Your opponent bets 100.",
    "You call all-in for 30.",
    "30 of theirs matches your 30; their other 70 goes back. These bets add 30 + 30 = 60 to the pot.",
  ];
  return (
    <figure className="diagram">
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step}>
            <span className="step-num" aria-hidden="true">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="bars" aria-hidden="true">
        <div className="bar-row">
          <span className="bar-label">Their 100</span>
          <span className="bar-track">
            <span className="seg-a" style={{ width: "30%" }}>30</span>
            <span className="seg-c" style={{ width: "70%" }}>70 goes back</span>
          </span>
        </div>
        <div className="bar-row">
          <span className="bar-label">Your 30</span>
          <span className="bar-track"><span className="seg-a" style={{ width: "30%" }}>30</span></span>
        </div>
      </div>
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
