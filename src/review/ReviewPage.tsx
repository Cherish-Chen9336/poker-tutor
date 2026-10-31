// The Review area: replay saved hands step by step from the learner's view,
// with a comment on each of the learner's decisions. Results are shown last,
// and the comments never depend on them.
import { useEffect, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import { useHands } from "../app/hand-store";
import { handLog, moveSentence, resultLine } from "../game/hand-log";
import type { HandRecord } from "../game/match";
import { reviewHand, type Verdict } from "../game/review";
import { CardText } from "../learn/cards";
import { TableFelt } from "../ui/TableFelt";

const VERDICT_LABEL: Record<Verdict, string> = { mistake: "✗ Mistake", good: "✓ Good", note: "Note" };

function HandReplay({ record }: { record: HandRecord }) {
  const comments = reviewHand(record);
  // Step i < moves.length shows the table just before move i; the last step shows the end.
  const steps = record.moves.length + 1;
  const [step, setStep] = useState(0);
  const atEnd = step === record.moves.length;
  const view = atEnd ? record.final! : record.moves[step].view;
  const current = atEnd ? null : record.moves[step];
  const comment = comments.find((c) => c.moveIndex === step);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest("input, textarea, select")) return;
      if (event.key === "ArrowRight") setStep((s) => Math.min(steps - 1, s + 1));
      if (event.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps]);

  return (
    <div className="guided">
      <div className="play-main">
        <TableFelt view={view} youSeat={record.learnerSeat} />
        <div className="replay-nav">
          <button type="button" className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            ← Back
          </button>
          <span className="mono">
            {atEnd ? "The end" : `Move ${step + 1} of ${record.moves.length}`}
          </span>
          <button type="button" className="button primary" disabled={atEnd} onClick={() => setStep(step + 1)}>
            Next →
          </button>
        </div>
        <p className="mono replay-tip">Tip: the ← and → keys step through the hand.</p>
      </div>
      <div className="gside">
        <div className="gcoach" aria-live="polite">
          {current ? (
            <>
              <p className="coach-says">
                <b>
                  <CardText text={moveSentence(record, step)} />
                </b>
              </p>
              {comment ? (
                <p className={`verdict ${comment.verdict}`}>
                  <span className="verdict-tag">{VERDICT_LABEL[comment.verdict]}</span> <CardText text={comment.text} />
                </p>
              ) : (
                <p className="mono">A bot's move. Bots' cards stay hidden until a showdown.</p>
              )}
            </>
          ) : (
            <>
              <p className="coach-says">
                <b>
                  <CardText text={resultLine(record.final!, record.net!, record.seats)} />
                </b>
              </p>
              <p className="mono">
                The result also depended on cards you couldn't see. Judge the decisions above, not the outcome (lesson 13).
              </p>
            </>
          )}
        </div>
        <details className="glog">
          <summary>The whole hand</summary>
          <ol>
            {handLog(record).map((line, i) => (
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

/** A neutral title: your starting cards, but not the result (that comes at the end of the replay). */
function handTitle(record: HandRecord): string {
  const first = record.moves[0]?.view ?? record.final!;
  const cards = (first.seats[0]?.cards ?? []).filter(Boolean).map((c) => `{${c}}`).join(" ");
  return `Match ${record.matchNumber}, hand ${record.handNumber}${cards ? ` · ${cards}` : ""}`;
}

export default function ReviewPage() {
  const { hands, saved, clear } = useHands();
  const newestFirst = [...hands].reverse();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useTakePendingFocus(heading);
  const selected = newestFirst.find((h) => h.id === selectedId) ?? newestFirst[0];

  if (!selected) {
    return (
      <section className="panel">
        <h1 tabIndex={-1} ref={heading}>
          Review
        </h1>
        <p className="lede">No hands yet. Play a few hands, and each one will appear here to replay step by step.</p>
        <p className="note">
          <a href="#/play">Go to Play</a>
        </p>
      </section>
    );
  }

  const mistakes = reviewHand(selected).filter((c) => c.verdict === "mistake").length;

  return (
    <section className="panel review">
      <div className="play-head">
        <h1 tabIndex={-1} ref={heading}>
          Review
        </h1>
        <p className="mono">
          {hands.length} {hands.length === 1 ? "hand" : "hands"} saved in this browser (up to 50)
        </p>
      </div>
      {!saved && <p className="note warn">This browser isn't saving hands. They'll be kept only until you close this page.</p>}
      <div className="review-layout">
        <nav className="hand-list" aria-label="Saved hands">
          <ol>
            {newestFirst.map((h) => (
              <li key={h.id}>
                <button type="button" aria-current={h.id === selected.id ? "true" : undefined} onClick={() => setSelectedId(h.id!)}>
                  <CardText text={handTitle(h)} />
                </button>
              </li>
            ))}
          </ol>
          {confirming ? (
            <div className="reset">
              <span>Delete all saved hands?</span>
              <button type="button" className="button danger" onClick={() => { clear(); setConfirming(false); }}>
                Yes, delete
              </button>
              <button type="button" className="button" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="button quiet" onClick={() => setConfirming(true)}>
              Delete saved hands
            </button>
          )}
        </nav>
        <div>
          <h2 className="review-title">
            <CardText text={handTitle(selected)} />
          </h2>
          <p className="mono review-sub">
            {selected.moves.filter((m) => m.actorSeat === selected.learnerSeat).length} decisions by you
            {mistakes ? ` · ${mistakes} clear ${mistakes === 1 ? "mistake" : "mistakes"}` : ""}. Comments use only what you
            could see at the time.
          </p>
          <HandReplay key={selected.id} record={selected} />
        </div>
      </div>
    </section>
  );
}
