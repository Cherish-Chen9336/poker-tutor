// The Review area: replay saved hands step by step from the learner's view,
// with a comment on each of the learner's decisions. Results are shown last,
// and the comments never depend on them.
import { useEffect, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import { useHands } from "../app/hand-store";
import { handFacts, moveFactAt, resultFact } from "../game/log-facts";
import type { HandRecord } from "../game/match";
import { reviewHand } from "../game/review";
import { useHref, useT } from "../i18n/hooks";
import { useLog } from "../i18n/log-text";
import { useComment } from "../i18n/review-text";
import { CardText } from "../learn/cards";
import { PokerTable } from "../ui/PokerTable";

function HandReplay({ record }: { record: HandRecord }) {
  const t = useT();
  const word = useLog();
  const wordComment = useComment();
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
    <div className="guided stacked">
      <div className="play-main">
        <PokerTable view={view} youSeat={record.learnerSeat} names={record.seats.map((seat) => seat.name)} />
        <div className="replay-nav">
          <button type="button" className="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
            {t("review.back")}
          </button>
          <span className="mono">{atEnd ? t("review.end") : t("review.move", { n: String(step + 1), total: String(record.moves.length) })}</span>
          <button type="button" className="button primary" disabled={atEnd} onClick={() => setStep(step + 1)}>
            {t("review.next")}
          </button>
        </div>
        <p className="mono replay-tip">{t("review.tip")}</p>
      </div>
      <div className="gside">
        <div className="gcoach" aria-live="polite">
          {current ? (
            <>
              <p className="coach-says">
                <b>
                  <CardText text={word(moveFactAt(record, step))} />
                </b>
              </p>
              {comment ? (
                <p className={`verdict ${comment.verdict}`}>
                  <span className="verdict-tag">{t("review.verdict", { verdict: comment.verdict })}</span>{" "}
                  <CardText text={wordComment(comment.fact)} />
                </p>
              ) : (
                <p className="mono">{t("review.botMove")}</p>
              )}
            </>
          ) : (
            <>
              <p className="coach-says">
                <b>
                  <CardText text={word({ kind: "result", result: resultFact(record.final!, record.seats), net: record.net! })} />
                </b>
              </p>
              <p className="mono">{t("review.resultNote")}</p>
            </>
          )}
        </div>
        <details className="glog">
          <summary>{t("review.wholeHand")}</summary>
          <ol>
            {handFacts(record).map((fact, i) => (
              <li key={i}>
                <CardText text={word(fact)} />
              </li>
            ))}
          </ol>
        </details>
      </div>
    </div>
  );
}

/** A neutral title: your starting cards, but not the result (that comes at the end of the replay). */
function handTitle(record: HandRecord, t: ReturnType<typeof useT>): string {
  const first = record.moves[0]?.view ?? record.final!;
  const cards = (first.seats[0]?.cards ?? []).filter(Boolean).map((c) => `{${c}}`).join(" ");
  return t("review.handTitle", {
    table: record.seats.length > 2 ? "six" : "two",
    players: String(record.seats.length),
    match: String(record.matchNumber),
    hand: String(record.handNumber),
    cards: cards ? t("review.handCards", { cards }) : "",
  });
}

export default function ReviewPage() {
  const t = useT();
  const href = useHref();
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
          {t("review.title")}
        </h1>
        <p className="lede">{t("review.empty")}</p>
        <p className="note">
          <a href={href({ area: "play" })}>{t("review.goPlay")}</a>
        </p>
      </section>
    );
  }

  const mistakes = reviewHand(selected).filter((c) => c.verdict === "mistake").length;
  const decisions = selected.moves.filter((m) => m.actorSeat === selected.learnerSeat).length;

  return (
    <section className="panel review">
      <div className="play-head">
        <h1 tabIndex={-1} ref={heading}>
          {t("review.title")}
        </h1>
        <p className="mono">{t("review.count", { hands: String(hands.length), count: hands.length })}</p>
      </div>
      {!saved && <p className="note warn">{t("review.noSave")}</p>}
      <div className="review-layout">
        <nav className="hand-list" aria-label={t("review.list")}>
          <ol>
            {newestFirst.map((h) => (
              <li key={h.id}>
                <button type="button" aria-current={h.id === selected.id ? "true" : undefined} onClick={() => setSelectedId(h.id!)}>
                  <CardText text={handTitle(h, t)} />
                </button>
              </li>
            ))}
          </ol>
          {confirming ? (
            <div className="reset">
              <span>{t("review.deleteAsk")}</span>
              <button type="button" className="button danger" onClick={() => { clear(); setConfirming(false); }}>
                {t("review.deleteYes")}
              </button>
              <button type="button" className="button" onClick={() => setConfirming(false)}>
                {t("review.cancel")}
              </button>
            </div>
          ) : (
            <button type="button" className="button quiet" onClick={() => setConfirming(true)}>
              {t("review.delete")}
            </button>
          )}
        </nav>
        <div>
          <h2 className="review-title">
            <CardText text={handTitle(selected, t)} />
          </h2>
          <p className="mono review-sub">
            {t("review.sub", {
              decisions: String(decisions),
              count: decisions,
              mistakes: mistakes ? t("review.mistakes", { mistakes: String(mistakes), count: mistakes }) : "",
            })}
          </p>
          <HandReplay key={selected.id} record={selected} />
        </div>
      </div>
    </section>
  );
}
