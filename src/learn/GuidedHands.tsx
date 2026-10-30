// Lesson 8: four guided hands at a small table, with the coach beside it.
import { useReducer, useState } from "react";
import type { Move } from "../game/types";
import { Card, CardText } from "./cards";
import { GUIDED_HANDS } from "./guided-hands";
import { describeMove, GuidedRun } from "./guided-run";

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function CardBack() {
  return <span className="pc md back" role="img" aria-label="Face-down card" />;
}

function HandTable({ run }: { run: GuidedRun }) {
  const view = run.view();
  const you = view.seats[run.youSeat]!;
  const bot = view.seats[1 - run.youSeat]!;
  const pot = view.pots.reduce((sum, p) => sum + p.amount, 0) + you.betThisStreet + bot.betThisStreet;
  // Once the hand is over the chips are already paid out, so say who won them.
  const winners = view.winners ?? [];
  const potLabel = !view.handOver
    ? `Pot ${pot}`
    : winners.length > 1
      ? `Split pot: ${winners.map((w) => w.amount).join(" + ")}`
      : `${winners[0]?.seat === run.youSeat ? "You won" : "The bot won"} ${winners[0]?.amount ?? 0}`;
  const seatRow = (seat: typeof you, label: string) => (
    <div className={`gseat ${view.actionTo === seat.seat ? "acting" : ""}`}>
      <div className="gseat-info">
        <b>
          {label}
          {view.buttonSeat === seat.seat && <span className="dealer-chip" title="Button">D</span>}
        </b>
        <span className="mono">{seat.stack} chips</span>
        {seat.betThisStreet > 0 && <span className="gbet">bet {seat.betThisStreet}</span>}
        {seat.status === "folded" && <span className="gbet">folded</span>}
      </div>
      <span className="pc-row">
        {seat.cards ? seat.cards.map((c, i) => (c ? <Card key={c} code={c} /> : <CardBack key={i} />)) : seat.status === "folded" ? null : [<CardBack key="a" />, <CardBack key="b" />]}
      </span>
    </div>
  );
  return (
    <div className="gtable" aria-label="Table">
      {seatRow(bot, "Bot")}
      <div className="gboard">
        <span className="pc-row" aria-label={view.board.length ? "Board" : "No board cards yet"}>
          {Array.from({ length: 5 }, (_, i) => (view.board[i] ? <Card key={view.board[i]} code={view.board[i]} /> : <span key={i} className="slot md" />))}
        </span>
        <span className="gpot mono">{potLabel}</span>
      </div>
      {seatRow(you, "You")}
    </div>
  );
}

function Coach({ run, onMove, feedback }: { run: GuidedRun; onMove: (move: Move) => void; feedback: string | null }) {
  const step = run.pending;
  const legal = step ? run.table.legalMoves(run.youSeat) : null;
  const scripted = step?.move;
  const moves: { move: Move; label: string }[] = [];
  if (legal) {
    moves.push({ move: { type: "fold" }, label: "Fold" });
    if (legal.check) moves.push({ move: { type: "check" }, label: "Check" });
    if (legal.call !== null) moves.push({ move: { type: "call" }, label: `Call ${legal.call}` });
    if (legal.bet) {
      const to = scripted?.type === "bet" ? scripted.to : legal.bet.min;
      moves.push({ move: { type: "bet", to }, label: `Bet ${to}` });
    }
    if (legal.raise) {
      const to = scripted?.type === "raise" ? scripted.to : legal.raise.min;
      moves.push({ move: { type: "raise", to }, label: `Raise to ${to}` });
    }
  }

  return (
    <div className="gcoach">
      {step ? (
        <>
          <p className="coach-says">
            <CardText text={step.coach ?? ""} />
          </p>
          <p className="ask">
            <b>Your move:</b> {capitalize(describeMove(step.move, legal?.call ?? null))}.
          </p>
          <div className="gmoves">
            {moves.map(({ move, label }) => (
              <button
                key={label}
                type="button"
                className={JSON.stringify(move) === JSON.stringify(scripted) ? "button primary" : "button"}
                onClick={() => onMove(move)}
              >
                {label}
              </button>
            ))}
          </div>
          {feedback && (
            <p className="gfeedback" role="status">
              {feedback}
            </p>
          )}
        </>
      ) : (
        <p className="coach-says" role="status">
          <CardText text={run.hand.ending} />
        </p>
      )}
    </div>
  );
}

function HandPlayer({ handIndex, onFinished }: { handIndex: number; onFinished: (id: number) => void }) {
  const hand = GUIDED_HANDS[handIndex];
  const [run, setRun] = useState(() => new GuidedRun(hand));
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [feedback, setFeedback] = useState<string | null>(null);

  function move(m: Move) {
    const result = run.tryMove(m);
    setFeedback(result.ok ? null : result.reason);
    rerender();
    if (result.ok && run.over) onFinished(hand.id);
  }

  return (
    <div className="guided">
      <HandTable run={run} />
      <div className="gside">
        <Coach run={run} onMove={move} feedback={feedback} />
        {run.over && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setRun(new GuidedRun(hand));
              setFeedback(null);
            }}
          >
            Play this hand again
          </button>
        )}
        <details className="glog" open>
          <summary>What happened</summary>
          <ol>
            {run.log.map((line, i) => (
              <li key={i}>
                <CardText text={line} />
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

export function GuidedHands() {
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState<Set<number>>(new Set());
  const hand = GUIDED_HANDS[current];
  const next = GUIDED_HANDS[current + 1];

  return (
    <section className="diagram guided-wrap" aria-label="Guided hands">
      <div className="seg hand-tabs" role="group" aria-label="Choose a hand">
        {GUIDED_HANDS.map((h, i) => (
          <button key={h.id} type="button" aria-pressed={i === current} onClick={() => setCurrent(i)}>
            Hand {h.id}
            {finished.has(h.id) && <span aria-label=" (played)"> ✓</span>}
          </button>
        ))}
      </div>
      <h3 className="ghead">
        Hand {hand.id}: {hand.title}
      </h3>
      <p className="gsub">{hand.youSeat === 0 ? "You have the button." : "The bot has the button, so you're the big blind."}</p>
      <HandPlayer key={hand.id} handIndex={current} onFinished={(id) => setFinished((s) => new Set(s).add(id))} />
      {finished.has(hand.id) && next && (
        <button type="button" className="button primary next-hand" onClick={() => setCurrent(current + 1)}>
          Next: Hand {next.id} →
        </button>
      )}
    </section>
  );
}
