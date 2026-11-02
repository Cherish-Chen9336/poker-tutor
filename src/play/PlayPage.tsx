// The Play area: heads-up against the practice bot, with a coach that
// describes the situation before each of the learner's moves.
import { useEffect, useReducer, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import { BOT_POLICY_VERSION, practiceBot } from "../game/bot";
import { BOT2_POLICY_VERSION, tableBot } from "../game/bot2";
import { coachLines } from "../game/coach";
import { useCoachLine } from "../i18n/coach-text";
import { useHref, useLocale, useT } from "../i18n/hooks";
import { useLog } from "../i18n/log-text";
import { handFacts } from "../game/log-facts";
import { Match, YOU_SEAT, type HandRecord } from "../game/match";
import { potTotal, sizedTo } from "../game/pot-math";
import type { LegalMoves, Move, TableView } from "../game/types";
import { useHands } from "../app/hand-store";
import { spokenText } from "../learn/card-names";
import { CardText } from "../learn/cards";
import { PokerTable } from "../ui/PokerTable";
import { equityRequests } from "../game/equity";
import { CoachHint } from "./CoachHint";
import { noticeText, type Notice } from "./notice";
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
  const t = useT();
  const range = legal.bet ?? legal.raise!;
  const kind = legal.bet ? "bet" : "raise";
  const [amount, setAmount] = useState(range.min);
  const preset = (fraction: number) => sizedTo(view, YOU_SEAT, legal, fraction) ?? range.min;
  const presets = [
    { label: t("play.half"), to: preset(0.5) },
    { label: t("play.pot"), to: preset(1) },
    { label: t("play.allIn"), to: range.max },
  ];
  const to = Math.min(range.max, Math.max(range.min, Math.round(amount) || range.min));
  const label = t("play.callAllIn", { label: t("move.label", { move: kind, amount: String(to) }), allIn: to === range.max ? "yes" : "no" });
  const amountLabel = t("play.amountLabel", { kind });
  return (
    <div className="sizer">
      <div className="sizer-row">
        <label className="visually-hidden" htmlFor="size-slider">
          {amountLabel}
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
          aria-label={amountLabel}
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
        {t("play.range", { min: String(range.min), max: String(range.max) })}
        {kind === "raise" ? t("play.presetNote") : ""}
      </p>
    </div>
  );
}

function Actions({ view, legal, onMove }: { view: TableView; legal: LegalMoves; onMove: (move: Move) => void }) {
  const t = useT();
  return (
    <div className="actions-bar" role="group" aria-label={t("play.yourMove")}>
      <div className="action-buttons">
        <button type="button" className="button" onClick={() => onMove({ type: "fold" })}>
          {t("move.label", { move: "fold" })}
        </button>
        {legal.check && (
          <button type="button" className="button" onClick={() => onMove({ type: "check" })}>
            {t("move.label", { move: "check" })}
          </button>
        )}
        {legal.call !== null && (
          <button type="button" className="button" onClick={() => onMove({ type: "call" })}>
            {t("play.callAllIn", {
              label: t("move.label", { move: "call", amount: String(legal.call) }),
              allIn: view.seats[YOU_SEAT]!.stack === legal.call ? "yes" : "no",
            })}
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
  // Kept as facts and worded when shown, so switching language never leaves old-language text behind.
  const [notice, setNotice] = useState<Notice | null>(null);
  // An announcement is spoken once, in the language it was made in; it's dropped if the language changes.
  const [announcement, setAnnouncement] = useState<{ text: string; locale: string }>({ text: "", locale: "en" });
  const { addHand, saved } = useHands();
  const [focusTick, setFocusTick] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const view = match.view();
  const legal = started ? match.legalMoves() : null;
  const record = match.current;
  const word = useLog();
  const log = record ? handFacts(record).map(word) : [];
  const t = useT();
  const locale = useLocale();

  // After a move, the pressed button may be gone: move focus to what comes next.
  useEffect(() => {
    if (focusTick === 0) return;
    if (match.handOver) nextRef.current?.focus();
    else actionsRef.current?.focus();
  }, [focusTick, match]);

  function afterChange(linesBefore: number) {
    const lines = match.current ? handFacts(match.current).map(word) : [];
    setAnnouncement({ text: spokenText(lines.slice(linesBefore).join(" "), locale), locale });
    const record = match.current;
    if (match.handOver && record && countFinished(size, record)) {
      // Saved for the Review screen; a hand too long to store is reported, not lost silently.
      if (!addHand(record).kept) setNotice({ kind: "tooLong" });
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
    const before = record ? handFacts(record).length : 0;
    const result = match.act(m);
    if (!result.ok) {
      setNotice({ kind: "rejected", reason: result.reason });
      return;
    }
    setNotice(null);
    afterChange(before);
  }

  // Odds are estimated only on the learner's turn, with the coach on.
  const oddsHole = started && coachOn && !match.handOver && view.actionTo === YOU_SEAT && view.seats[YOU_SEAT]?.cards?.every(Boolean) ? (view.seats[YOU_SEAT]!.cards as string[]) : null;
  const estimates = useEquity(oddsHole, view.board, oddsHole ? equityRequests(view, YOU_SEAT) : []);
  const coachLine = useCoachLine();
  const href = useHref();

  if (!started) {
    return (
      <section className="panel play-intro">
        <h1 tabIndex={-1} ref={heading}>
          {t("play.title")}
        </h1>
        <p className="lede">{t("play.intro")}</p>
        <div className="seg size-choice" role="group" aria-label={t("play.tableSize")}>
          {([2, 6] as const).map((n) => (
            <button key={n} type="button" aria-pressed={size === n} onClick={() => choose(n)}>
              {n === 2 ? t("play.chooseHeadsUp") : t("play.chooseSix")}
            </button>
          ))}
        </div>
        <ul>
          <li>{t("play.botsFixed")}</li>
          {size === 6 && <li>{t("play.topUp")}</li>}
          {size === 6 && <li>{t("play.callers")}</li>}
          <li>{t("play.coachNote")}</li>
          <li>{t("play.chipsOnly")}</li>
        </ul>
        <button type="button" className="button primary" onClick={deal}>
          {t("play.dealFirst")}
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
          {t("play.title")}
        </h1>
        <div className="seg" role="group" aria-label={t("play.tableSize")}>
          {([2, 6] as const).map((n) => (
            <button key={n} type="button" aria-pressed={size === n} onClick={() => choose(n)}>
              {n === 2 ? t("play.headsUp") : t("play.six")}
            </button>
          ))}
        </div>
        <p className="mono">
          {t("play.status", {
            size: size === 2 ? "two" : "six",
            number: String(match.matchNumber),
            hands: String(totals.hands),
            count: totals.hands,
            net: matchNet > 0 ? "up" : matchNet < 0 ? "down" : "even",
            amount: String(Math.abs(matchNet)),
          })}
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
                <a href={href({ area: "review" })}>{t("play.reviewThis")}</a>
                {!saved && <p className="mono">{t("play.noSave")}</p>}
                {match.matchOver ? (
                  <>
                    <p>{t("play.out", { who: stack === 0 ? "you" : "bot", size: size === 2 ? "two" : "six" })}</p>
                    <button ref={nextRef} type="button" className="button primary" onClick={deal}>
                      {t("play.newMatch")}
                    </button>
                  </>
                ) : (
                  <button ref={nextRef} type="button" className="button primary" onClick={deal}>
                    {t("play.next")}
                  </button>
                )}
              </div>
            ) : (
              <p className="mono">{t("play.thinking", { size: size === 2 ? "two" : "six" })}</p>
            )}
            {notice && (
              <p className="gfeedback" role="alert">
                {noticeText(notice, locale, t)}
              </p>
            )}
          </div>
        </div>
        <div className="gside">
          <div className="gcoach">
            <div className="coach-top">
              <b>{t("play.coach")}</b>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={coachOn}
                  onChange={(e) => {
                    setCoachOn(e.target.checked);
                    saveCoachSetting(e.target.checked);
                  }}
                />
                {t("play.hintsSwitch")}
              </label>
            </div>
            {coachOn ? (
              yourTurn ? (
                <>
                  {locale !== "en" && <p className="note">{t("play.coachEnglish")}</p>}
                  <ul className="coach-list">
                    {coach.map((line, i) => (
                      <CoachHint key={i} line={line} phrase={coachLine} />
                    ))}
                  </ul>
                  {hole && <OddsBox estimates={estimates} />}
                </>
              ) : (
                <p className="mono">{t("play.hintsLater")}</p>
              )
            ) : (
              <p className="mono">{t("play.hintsOff")}</p>
            )}
          </div>
          <details className="glog" open>
            <summary>{t("play.thisHand")}</summary>
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
        {announcement.locale === locale ? announcement.text : ""}
      </p>
    </section>
  );
}
