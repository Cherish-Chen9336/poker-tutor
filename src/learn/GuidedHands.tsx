// Lesson 8: four guided hands at a small table, with the coach beside it.
import { createContext, use, useContext, useEffect, useReducer, useRef, useState } from "react";
import type { Move } from "../game/types";
import { useLocale, useT } from "../i18n/hooks";
import { useLog } from "../i18n/log-text";
import { spokenText } from "./card-names";
import { TableFelt } from "../ui/TableFelt";
import { CardText } from "./cards";
import { GUIDED_HANDS, type GuidedHand } from "./guided-hands";
import { GuidedRun, type MoveCheck } from "./guided-run";
import { guidedText, type GuidedText } from "./guided-text";

/** The hands' words (titles, coach lines, endings) in the content language; empty means English. */
const Words = createContext<GuidedText>({});

/** A hand's title, coach line for a script step, and ending, in the content language. */
function useHandWords(hand: GuidedHand) {
  const words = useContext(Words)[hand.id];
  return {
    title: words?.title ?? hand.title,
    coach: (index: number) => words?.coach[index] ?? hand.script[index]?.coach ?? "",
    ending: words?.ending ?? hand.ending,
  };
}

/** "fold", "call 4", "raise to 6"… as a label ("Call 4") or inside a sentence. */
function useMoveWords() {
  const t = useT();
  const values = (move: Move, call: number | null) => ({
    move: move.type === "call" && call === null ? "callNone" : move.type,
    amount: String(move.type === "call" ? (call ?? "") : "to" in move ? move.to : ""),
  });
  return {
    label: (move: Move, call: number | null) => t("move.label", values(move, call)),
    phrase: (move: Move, call: number | null) => t("move.phrase", values(move, call)),
  };
}

function HandTable({ run }: { run: GuidedRun }) {
  return <TableFelt view={run.view()} youSeat={run.youSeat} />;
}

function Coach({ run, onMove, feedback, boxRef }: { run: GuidedRun; onMove: (move: Move) => void; feedback: string | null; boxRef: React.RefObject<HTMLDivElement | null> }) {
  const t = useT();
  const words = useHandWords(run.hand);
  const moveWords = useMoveWords();
  const step = run.pending;
  const legal = step ? run.table.legalMoves(run.youSeat) : null;
  const scripted = step?.move;
  const moves: { move: Move; label: string }[] = [];
  if (legal) {
    const add = (move: Move) => moves.push({ move, label: moveWords.label(move, legal.call) });
    add({ type: "fold" });
    if (legal.check) add({ type: "check" });
    if (legal.call !== null) add({ type: "call" });
    if (legal.bet) add({ type: "bet", to: scripted?.type === "bet" ? scripted.to : legal.bet.min });
    if (legal.raise) add({ type: "raise", to: scripted?.type === "raise" ? scripted.to : legal.raise.min });
  }

  return (
    <div className="gcoach" tabIndex={-1} ref={boxRef} aria-label={t("play.coach")}>
      {step ? (
        <>
          <p className="coach-says">
            <CardText text={words.coach(run.stepIndex)} />
          </p>
          <p className="ask">{t("guided.yourMove", { move: moveWords.label(step.move, legal?.call ?? null) })}</p>
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
          <CardText text={words.ending} />
        </p>
      )}
    </div>
  );
}

function HandPlayer({ handIndex, onFinished }: { handIndex: number; onFinished: (id: number) => void }) {
  const t = useT();
  const locale = useLocale();
  const word = useLog();
  const moveWords = useMoveWords();
  const hand = GUIDED_HANDS[handIndex];
  const words = useHandWords(hand);
  const [run, setRun] = useState(() => new GuidedRun(hand));
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [refusal, setRefusal] = useState<MoveCheck | null>(null);
  // Spoken once, in the language it was made in; dropped if the language changes.
  const [announcement, setAnnouncement] = useState<{ text: string; locale: string }>({ text: "", locale: "en" });
  const [moves, setMoves] = useState(0);
  const coachBox = useRef<HTMLDivElement>(null);

  // The pressed button disappears after a move, so keep keyboard focus on the coach.
  useEffect(() => {
    if (moves > 0) coachBox.current?.focus();
  }, [moves]);

  function move(m: Move) {
    const logBefore = run.facts.length;
    const result = run.tryMove(m);
    setRefusal(result.ok ? null : result);
    if (result.ok) {
      // Tell screen readers what just happened and what comes next.
      const next = run.pending ? t("guided.coachSays", { text: words.coach(run.stepIndex) }) : words.ending;
      setAnnouncement({ text: spokenText([...run.facts.slice(logBefore).map(word), next].join(" "), locale), locale });
      setMoves((n) => n + 1);
    }
    rerender();
    if (result.ok && run.over) onFinished(hand.id);
  }

  return (
    <div className="guided">
      <HandTable run={run} />
      <div className="gside">
        <Coach
          run={run}
          onMove={move}
          feedback={
            refusal && !refusal.ok
              ? refusal.why.kind === "notYourTurn"
                ? t("guided.notYourTurn")
                : t("guided.wrongMove", { move: moveWords.phrase(refusal.why.move, refusal.why.call) })
              : null
          }
          boxRef={coachBox}
        />
        <p className="visually-hidden" role="status">
          {announcement.locale === locale ? announcement.text : ""}
        </p>
        {run.over && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setRun(new GuidedRun(hand));
              setRefusal(null);
              setAnnouncement({ text: t("guided.restarted"), locale });
              setMoves((n) => n + 1);
            }}
          >
            {t("guided.again")}
          </button>
        )}
        <details className="glog" open>
          <summary>{t("guided.what")}</summary>
          <ol>
            {run.facts.map((fact, i) => (
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

/** Lesson 8's four hands, in the content language (loading its words first when it isn't English). */
export function GuidedHands() {
  const locale = useLocale();
  const words = locale === "en" ? {} : use(guidedText(locale));
  return (
    <Words value={words}>
      <GuidedHandsInner />
    </Words>
  );
}

function GuidedHandsInner() {
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState<Set<number>>(new Set());
  const t = useT();
  const hand = GUIDED_HANDS[current];
  const next = GUIDED_HANDS[current + 1];
  const words = useHandWords(hand);

  return (
    <section className="diagram guided-wrap" aria-label={t("guided.label")}>
      <div className="seg hand-tabs" role="group" aria-label={t("guided.choose")}>
        {GUIDED_HANDS.map((h, i) => (
          <button key={h.id} type="button" aria-pressed={i === current} onClick={() => setCurrent(i)}>
            {t("guided.tab", { n: String(h.id) })}
            {finished.has(h.id) && <span aria-label={t("guided.played")}> ✓</span>}
          </button>
        ))}
      </div>
      <h3 className="ghead">{t("guided.heading", { n: String(hand.id), title: words.title })}</h3>
      <p className="gsub">{hand.youSeat === 0 ? t("guided.youButton") : t("guided.botButton")}</p>
      <HandPlayer key={hand.id} handIndex={current} onFinished={(id) => setFinished((s) => new Set(s).add(id))} />
      {finished.has(hand.id) && next && (
        <button type="button" className="button primary next-hand" onClick={() => setCurrent(current + 1)}>
          {t("guided.next", { n: String(next.id) })}
        </button>
      )}
    </section>
  );
}
