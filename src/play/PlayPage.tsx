// The Play area: heads-up against the practice bot, with a coach that
// describes the situation before each of the learner's moves.
import { useEffect, useReducer, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import { BOT_POLICY_VERSION, practiceBot } from "../game/bot";
import { BOT2_POLICY_VERSION, tableBot } from "../game/bot2";
import { coachLines } from "../game/coach";
import { handLog } from "../game/hand-log";
import { Match, YOU_SEAT, type HandRecord } from "../game/match";
import { potTotal, sizedTo } from "../game/pot-math";
import type { LegalMoves, Move, TableView } from "../game/types";
import { useHands } from "../app/hand-store";
import { spokenText } from "../learn/card-names";
import { CardText } from "../learn/cards";
import { PokerTable } from "../ui/PokerTable";
import { equityRequests } from "../game/equity";
import { OddsBox } from "./OddsBox";
import { useEquity } from "./useEquity";

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

type Size = 2 | 6;

// Each table size keeps its own session, outside the page, so visiting Review
// (or a lesson, or the other table) and coming back continues where you were.
interface Session {
  match: Match | null;
  started: boolean;
  /** Finished hands and the learner's total per session (kept small: no records). */
  results: Map<number, { hands: number; net: number }>;
  saved: WeakSet<HandRecord>;
}
const sessions: Record<Size, Session> = {
  2: { match: null, started: false, results: new Map(), saved: new WeakSet() },
  6: { match: null, started: false, results: new Map(), saved: new WeakSet() },
};
let lastSize: Size = 2;

function rememberSize(size: Size) {
  lastSize = size;
}

function markStarted(size: Size) {
  sessions[size].started = true;
}

/** Counts a finished hand once; returns false if it was already counted. */
function countFinished(size: Size, record: HandRecord): boolean {
  const session = sessions[size];
  if (session.saved.has(record)) return false;
  session.saved.add(record);
  const totals = session.results.get(record.matchNumber) ?? { hands: 0, net: 0 };
  session.results.set(record.matchNumber, { hands: totals.hands + 1, net: totals.net + (record.net ?? 0) });
  return true;
}

function sessionMatch(size: Size): Match {
  sessions[size].match ??=
    size === 2
      ? new Match({ bot: practiceBot, botVersion: BOT_POLICY_VERSION })
      : new Match({ bot: tableBot, botVersion: BOT2_POLICY_VERSION, players: 6 });
  return sessions[size].match!;
}

export default function PlayPage() {
  const [size, setSize] = useState<Size>(lastSize);
  const session = sessions[size];
  const match = sessionMatch(size);
  const names = match.seats.map((s) => s.name);
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [started, setStarted] = useState(session.started);
  const choose = (next: Size) => {
    rememberSize(next);
    setSize(next);
    setStarted(sessions[next].started);
    setNotice(null);
  };
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
    if (match.handOver && record && countFinished(size, record)) {
      // Saved for the Review screen; a hand too long to store is reported, not lost silently.
      if (!addHand(record).kept) setNotice("This hand was too long to save for Review.");
    }
    setFocusTick((n) => n + 1);
    rerender();
  }

  function deal() {
    match.dealNext();
    markStarted(size);
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

  // Odds are estimated only on the learner's turn, with the coach on.
  const oddsHole = started && coachOn && !match.handOver && view.actionTo === YOU_SEAT && view.seats[YOU_SEAT]?.cards?.every(Boolean) ? (view.seats[YOU_SEAT]!.cards as string[]) : null;
  const estimates = useEquity(oddsHole, view.board, oddsHole ? equityRequests(view, YOU_SEAT) : []);

  if (!started) {
    return (
      <section className="panel play-intro">
        <h1 tabIndex={-1} ref={heading}>
          Play
        </h1>
        <p className="lede">Choose a table. Blinds are 1/2, and everyone starts with 200 chips. The button moves every hand.</p>
        <div className="seg size-choice" role="group" aria-label="Table size">
          {([2, 6] as const).map((n) => (
            <button key={n} type="button" aria-pressed={size === n} onClick={() => choose(n)}>
              {n === 2 ? "Heads-up: you and 1 bot" : "6 players: you and 5 bots"}
            </button>
          ))}
        </div>
        <ul>
          <li>The bots play a simple, fixed style. Each sees only its own cards, never yours.</li>
          {size === 6 && <li>A bot that runs out of chips is topped back up to 200. If you run out, a new session starts.</li>}
          {size === 6 && (
            <li>
              The bots are simplified practice opponents that call a lot, so expect pots with several players. Against frequent
              callers, bet your good hands and bluff less.
            </li>
          )}
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
  const hole = view.seats[YOU_SEAT]?.cards?.every(Boolean) ? (view.seats[YOU_SEAT]!.cards as string[]) : null;
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
        <div className="seg" role="group" aria-label="Table size">
          {([2, 6] as const).map((n) => (
            <button key={n} type="button" aria-pressed={size === n} onClick={() => choose(n)}>
              {n === 2 ? "Heads-up" : "6 players"}
            </button>
          ))}
        </div>
        <p className="mono">
          {size === 2 ? "Match" : "Session"} {match.matchNumber} · {totals.hands} {totals.hands === 1 ? "hand" : "hands"} played ·{" "}
          {matchNet > 0 ? `you're ${matchNet} up` : matchNet < 0 ? `you're ${-matchNet} down` : "you're even"}
        </p>
      </div>
      <div className={size === 6 ? "guided six" : "guided"}>
        <div className="play-main">
          <PokerTable view={view} youSeat={YOU_SEAT} names={names} />
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
                    <p>
                      {stack === 0 ? "You're out of chips." : "The bot is out of chips."} A new {size === 2 ? "match" : "session"} starts with 200 each.
                    </p>
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
              <p className="mono">{size === 2 ? "The bot is" : "The bots are"} thinking…</p>
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
                <>
                  <ul className="coach-list">
                    {coach.map((line, i) => (
                      <li key={i} className={`topic-${line.topic}`}>
                        <CardText text={line.text} />
                      </li>
                    ))}
                  </ul>
                  {hole && <OddsBox estimates={estimates} />}
                </>
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
