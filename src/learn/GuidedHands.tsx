// Lesson 8: four guided hands at a small table, with the coach beside it.
import { useEffect, useReducer, useRef, useState } from "react";
import type { Move } from "../game/types";
import { spokenText } from "./card-names";
import { TableFelt } from "../ui/TableFelt";
import { CardText } from "./cards";
import { GUIDED_HANDS } from "./guided-hands";
import { describeMove, GuidedRun } from "./guided-run";

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function HandTable({ run }: { run: GuidedRun }) {
  return <TableFelt view={run.view()} youSeat={run.youSeat} />;
}

function Coach({ run, onMove, feedback, boxRef }: { run: GuidedRun; onMove: (move: Move) => void; feedback: string | null; boxRef: React.RefObject<HTMLDivElement | null> }) {
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
    <div className="gcoach" tabIndex={-1} ref={boxRef} aria-label="Coach">
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
        <p className="coach-says">
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
  const [announcement, setAnnouncement] = useState("");
  const [moves, setMoves] = useState(0);
  const coachBox = useRef<HTMLDivElement>(null);

  // The pressed button disappears after a move, so keep keyboard focus on the coach.
  useEffect(() => {
    if (moves > 0) coachBox.current?.focus();
  }, [moves]);

  function move(m: Move) {
    const logBefore = run.log.length;
    const result = run.tryMove(m);
    setFeedback(result.ok ? null : result.reason);
    if (result.ok) {
      // Tell screen readers what just happened and what comes next.
      const next = run.pending ? `Coach: ${run.pending.coach}` : run.hand.ending;
      setAnnouncement(spokenText([...run.log.slice(logBefore), next].join(" ")));
      setMoves((n) => n + 1);
    }
    rerender();
    if (result.ok && run.over) onFinished(hand.id);
  }

  return (
    <div className="guided">
      <HandTable run={run} />
      <div className="gside">
        <Coach run={run} onMove={move} feedback={feedback} boxRef={coachBox} />
        <p className="visually-hidden" role="status">
          {announcement}
        </p>
        {run.over && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setRun(new GuidedRun(hand));
              setFeedback(null);
              setAnnouncement("The hand starts again.");
              setMoves((n) => n + 1);
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
