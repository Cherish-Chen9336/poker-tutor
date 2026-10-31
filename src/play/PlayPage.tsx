// The Play area: heads-up against the practice bot, with a coach that
// describes the situation before each of the learner's moves.
import { useEffect, useReducer, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import { BOT_POLICY_VERSION, practiceBot } from "../game/bot";
import { coachLines } from "../game/coach";
import { handLog } from "../game/hand-log";
import { Match, YOU_SEAT, type HandRecord } from "../game/match";
import { potTotal, sizedTo } from "../game/pot-math";
import type { LegalMoves, Move, TableView } from "../game/types";
import { useHands } from "../app/hand-store";
import { spokenText } from "../learn/card-names";
import { CardText } from "../learn/cards";
import { TableFelt } from "../ui/TableFelt";

const COACH_KEY = "poker-tutor:coach";

function loadCoachSetting(): boolean {
  try {
    return window.localStorage.getItem(COACH_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveCoachSetting(on: boolean) {
  try {
    window.localStorage.setItem(COACH_KEY, on ? "on" : "off");
  } catch {
    // Not saved; the switch still works for this visit.
  }
}

function SizeChooser({ view, legal, onMove }: { view: TableView; legal: LegalMoves; onMove: (move: Move) => void }) {
  const range = legal.bet ?? legal.raise!;
  const kind = legal.bet ? "bet" : "raise";
  const [amount, setAmount] = useState(range.min);
  const preset = (fraction: number) => sizedTo(view, YOU_SEAT, legal, fraction) ?? range.min;
  const presets = [
    { label: "½ pot", to: preset(0.5) },
    { label: "Pot", to: preset(1) },
    { label: "All-in", to: range.max },
  ];
  const to = Math.min(range.max, Math.max(range.min, Math.round(amount) || range.min));
  const label = `${kind === "bet" ? "Bet" : "Raise to"} ${to}${to === range.max ? " (all-in)" : ""}`;
  return (
    <div className="sizer">
      <div className="sizer-row">
        <label className="visually-hidden" htmlFor="size-slider">
          {kind === "bet" ? "Bet amount" : "Raise to"}
        </label>
        <input
          id="size-slider"
          type="range"
          min={range.min}
          max={range.max}
          step={1}
          value={to}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <input
          className="size-number"
          type="number"
          aria-label={kind === "bet" ? "Bet amount" : "Raise to"}
          min={range.min}
          max={range.max}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div className="sizer-row">
        {presets.map((p) => (
          <button key={p.label} type="button" className="button chip-btn" aria-pressed={p.to === to} onClick={() => setAmount(p.to)}>
            {p.label}
          </button>
        ))}
        <button type="button" className="button primary" onClick={() => onMove({ type: kind, to })}>
          {label}
        </button>
      </div>
      <p className="sizer-note">
        From {range.min} (the minimum) to {range.max} (all-in).
        {kind === "raise" ? " Presets mean: call, then raise by that share of the pot." : ""}
      </p>
    </div>
  );
}

function Actions({ view, legal, onMove }: { view: TableView; legal: LegalMoves; onMove: (move: Move) => void }) {
  return (
    <div className="actions-bar" role="group" aria-label="Your move">
      <div className="action-buttons">
        <button type="button" className="button" onClick={() => onMove({ type: "fold" })}>
          Fold
        </button>
        {legal.check && (
          <button type="button" className="button" onClick={() => onMove({ type: "check" })}>
            Check
          </button>
        )}
        {legal.call !== null && (
          <button type="button" className="button" onClick={() => onMove({ type: "call" })}>
            Call {legal.call}
            {view.seats[YOU_SEAT]!.stack === legal.call ? " (all-in)" : ""}
          </button>
        )}
      </div>
      {(legal.bet || legal.raise) && <SizeChooser key={`${view.street}-${potTotal(view)}`} view={view} legal={legal} onMove={onMove} />}
    </div>
  );
}

// The match lives outside the page, so visiting Review (or a lesson) and coming
// back continues the same match instead of starting over.
const session = {
  match: null as Match | null,
  started: false,
  /** Finished hands and the learner's total per match (kept small: no records). */
  results: new Map<number, { hands: number; net: number }>(),
  saved: new WeakSet<HandRecord>(),
};

function sessionMatch(): Match {
  session.match ??= new Match({ bot: practiceBot, botVersion: BOT_POLICY_VERSION });
  return session.match;
}

export default function PlayPage() {
  const match = sessionMatch();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [started, setStarted] = useState(session.started);
  const heading = useRef<HTMLHeadingElement>(null);
  useTakePendingFocus(heading);
  const [coachOn, setCoachOn] = useState(loadCoachSetting);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { addHand, saved } = useHands();
  const [focusTick, setFocusTick] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const view = match.view();
  const legal = started ? match.legalMoves() : null;
  const record = match.current;
  const log = record ? handLog(record) : [];

  // After a move, the pressed button may be gone: move focus to what comes next.
  useEffect(() => {
    if (focusTick === 0) return;
    if (match.handOver) nextRef.current?.focus();
    else actionsRef.current?.focus();
  }, [focusTick, match]);

  function afterChange(linesBefore: number) {
    const lines = match.current ? handLog(match.current) : [];
    setAnnouncement(spokenText(lines.slice(linesBefore).join(" ")));
    const record = match.current;
    if (match.handOver && record && !session.saved.has(record)) {
      session.saved.add(record);
      const totals = session.results.get(record.matchNumber) ?? { hands: 0, net: 0 };
      session.results.set(record.matchNumber, { hands: totals.hands + 1, net: totals.net + (record.net ?? 0) });
      addHand(record); // saved for the Review screen
    }
    setFocusTick((n) => n + 1);
    rerender();
  }

  function deal() {
    match.dealNext();
    session.started = true;
    setStarted(true);
    setNotice(null);
    afterChange(0);
  }

  function move(m: Move) {
    const before = record ? handLog(record).length : 0;
    const result = match.act(m);
    if (!result.ok) {
      setNotice(result.reason);
      return;
    }
    setNotice(null);
    afterChange(before);
  }

  if (!started) {
    return (
      <section className="panel play-intro">
        <h1 tabIndex={-1} ref={heading}>
          Play
        </h1>
        <p className="lede">
          Heads-up against a practice bot. Blinds are 1/2 and you both start with 200 chips. The button switches every hand.
        </p>
        <ul>
          <li>The bot plays a simple, fixed style. It only sees its own cards, never yours.</li>
          <li>The coach describes your situation before each move. It doesn't tell you what to do.</li>
          <li>Play chips only. Your hands are saved in this browser, so you can replay them in Review.</li>
        </ul>
        <button type="button" className="button primary" onClick={deal}>
          Deal the first hand
        </button>
      </section>
    );
  }

  const coach = coachOn ? coachLines(view) : [];
  const yourTurn = !match.handOver && view.actionTo === YOU_SEAT && legal;
  const stack = view.seats[YOU_SEAT]!.stack;
  // Count only finished hands, so a posted blind doesn't look like a loss.
  const totals = session.results.get(match.matchNumber) ?? { hands: 0, net: 0 };
  const matchNet = totals.net;

  return (
    <section className="panel play">
      <div className="play-head">
        <h1 tabIndex={-1} ref={heading}>
          Play
        </h1>
        <p className="mono">
          Match {match.matchNumber} · {totals.hands} {totals.hands === 1 ? "hand" : "hands"} played ·{" "}
          {matchNet > 0 ? `you're ${matchNet} up` : matchNet < 0 ? `you're ${-matchNet} down` : "you're even"}
        </p>
      </div>
      <div className="guided">
        <div className="play-main">
          <TableFelt view={view} youSeat={YOU_SEAT} />
          <div ref={actionsRef} tabIndex={-1} className="play-controls">
            {yourTurn ? (
              <Actions view={view} legal={legal} onMove={move} />
            ) : match.handOver ? (
              <div className="hand-done">
                <p>
                  <CardText text={log.at(-1) ?? ""} />
                </p>
                <a href="#/review">Review this hand</a>
                {!saved && <p className="mono">This browser isn't saving hands, so they'll be kept only until you close the page.</p>}
                {match.matchOver ? (
                  <>
                    <p>{stack === 0 ? "You're out of chips." : "The bot is out of chips."} A new match starts with 200 each.</p>
                    <button ref={nextRef} type="button" className="button primary" onClick={deal}>
                      Start a new match
                    </button>
                  </>
                ) : (
                  <button ref={nextRef} type="button" className="button primary" onClick={deal}>
                    Deal the next hand
                  </button>
                )}
              </div>
            ) : (
              <p className="mono">The bot is thinking…</p>
            )}
            {notice && (
              <p className="gfeedback" role="alert">
                {notice}
              </p>
            )}
          </div>
        </div>
        <div className="gside">
          <div className="gcoach">
            <div className="coach-top">
              <b>Coach</b>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={coachOn}
                  onChange={(e) => {
                    setCoachOn(e.target.checked);
                    saveCoachSetting(e.target.checked);
                  }}
                />
                Hints before my move
              </label>
            </div>
            {coachOn ? (
              yourTurn ? (
                <ul className="coach-list">
                  {coach.map((line, i) => (
                    <li key={i} className={`topic-${line.topic}`}>
                      <CardText text={line.text} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mono">Hints appear when it's your turn.</p>
              )
            ) : (
              <p className="mono">Hints are off.</p>
            )}
          </div>
          <details className="glog" open>
            <summary>This hand</summary>
            <ol>
              {log.map((line, i) => (
                <li key={i}>
                  <CardText text={line} />
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
    </section>
  );
}
