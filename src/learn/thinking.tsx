// Interactive pieces for lessons 9 and 10: a pot-odds calculator and the
// gambler's fallacy simulation.
import { useEffect, useId, useRef, useState } from "react";
import { oneCardOdds } from "../game/hands";
import { useT } from "../i18n/hooks";
import { averageResultParts, LESSON9_EXAMPLE } from "./diagram-data";
import { addTally, EMPTY_TALLY, interval95, PREMIUM_CHANCE, runBlocks, secureRandom, type StreakTally } from "../game/simulate";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** The final pot split into the call and the pot, and the chance needed against the chance you have. */
function PriceBars({ pot, call, need, have }: { pot: number; call: number; need: number; have: number }) {
  const t = useT();
  return (
    <div className="price" aria-hidden="true">
      <div className="price-strip">
        <span className="seg-a" style={{ flexGrow: call }} />
        <span className="seg-b" style={{ flexGrow: pot }} />
      </div>
      <p className="price-note">{t("price.finalPot", { total: pot + call })}</p>
      {(
        [
          ["need", t("price.need"), need],
          ["have", t("price.have"), have],
        ] as const
      ).map(([kind, label, share]) => (
        <div key={kind} className="price-row">
          <span>{label}</span>
          <span className="price-track">
            <span className={`price-${kind}`} style={{ width: `${share * 100}%` }} />
          </span>
          <span className="mono">{pct(share)}</span>
        </div>
      ))}
    </div>
  );
}

export function PotOddsCalculator() {
  const t = useT();
  const odds = oneCardOdds(LESSON9_EXAMPLE.you, LESSON9_EXAMPLE.opponent, LESSON9_EXAMPLE.board);
  const [pot, setPot] = useState(100);
  const [call, setCall] = useState(50);
  const potId = useId();
  const callId = useId();
  const valid = pot > 0 && call > 0;
  const breakEven = valid ? call / (pot + call) : 0;
  const ev = odds.equity * (pot + call) - call;
  const even = Math.abs(ev) < 0.05; // rounds to 0.0 chips
  const presets = [
    { label: t("calc.case1"), pot: 100, call: 50 },
    { label: t("calc.case2"), pot: 200, call: 25 },
  ];
  const result = averageResultParts(ev);

  return (
    <figure className="diagram calc">
      <div className="seg-row">
        <div className="seg" role="group" aria-label={t("calc.examples")}>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={pot === p.pot && call === p.call}
              onClick={() => {
                setPot(p.pot);
                setCall(p.call);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="calc-body">
        <div className="calc-fields">
          <label htmlFor={potId}>{t("calc.pot")}</label>
          <input id={potId} type="number" min={1} step={1} inputMode="numeric" value={pot} onChange={(e) => setPot(Math.max(0, Math.round(Number(e.target.value))))} />
          <label htmlFor={callId}>{t("calc.call")}</label>
          <input id={callId} type="number" min={1} step={1} inputMode="numeric" value={call} onChange={(e) => setCall(Math.max(0, Math.round(Number(e.target.value))))} />
        </div>
        <dl className="calc-out" aria-live="polite">
          <dt>{t("calc.breakEven")}</dt>
          <dd>{valid ? `${call} ÷ ${pot + call} = ${pct(breakEven)}` : t("calc.enter")}</dd>
          <dt>{t("calc.chance")}</dt>
          <dd>{pct(odds.equity)}</dd>
          <dt>{t("calc.average")}</dt>
          <dd className={!valid || even ? "" : ev > 0 ? "good" : "bad"}>{valid ? (result.even ? t("calc.even") : t("calc.result", result)) : "—"}</dd>
        </dl>
      </div>
      {valid && <PriceBars pot={pot} call={call} need={breakEven} have={odds.equity} />}
      <figcaption>{t("calc.caption", { callKey: <span key="c" className="key call" />, potKey: <span key="p" className="key pot" /> })}</figcaption>
    </figure>
  );
}

const SCALE = 0.06; // the bars show 0% to 6%

export function RateBar({ label, hits, trials }: { label: string; hits: number; trials: number }) {
  const t = useT();
  const rate = trials ? hits / trials : 0;
  const [low, high] = interval95(hits, trials);
  const at = (x: number) => `${(Math.min(x, SCALE) / SCALE) * 100}%`;
  return (
    <div className="rate">
      <div className="rate-label">
        <b>{label}</b>
        <span className="mono">
          {trials
            ? t("streak.cases", { hits: hits.toLocaleString("en-US"), trials: trials.toLocaleString("en-US"), rate: pct(rate, 2) })
            : t("streak.noCases")}
        </span>
      </div>
      <div className="rate-track" aria-hidden="true">
        {trials > 0 && <span className="rate-fill" style={{ width: at(rate) }} />}
        {trials > 0 && <span className="rate-ci" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />}
        <span className="rate-expected" style={{ left: at(PREMIUM_CHANCE) }} />
      </div>
      {trials > 0 && (
        <span className="rate-note">
          {t("streak.range", { low: pct(low, 1), high: high > SCALE ? t("streak.beyond", { high: pct(high, 1) }) : pct(high, 1) })}
        </span>
      )}
    </div>
  );
}

const BLOCKS_PER_CLICK = 10_000; // 40,000 hands
const BLOCKS_PER_STEP = 1_000; // dealt in small steps so the page stays responsive

export function StreakDemo() {
  const t = useT();
  const [tally, setTally] = useState<StreakTally>(EMPTY_TALLY);
  const [dealing, setDealing] = useState(false);
  const run = useRef(0);

  function deal() {
    const id = ++run.current;
    const random = secureRandom();
    setDealing(true);
    let left = BLOCKS_PER_CLICK;
    const step = () => {
      if (run.current !== id) return; // "Start over" was pressed, or the page closed
      // Deal outside the state update, so React may safely run the update twice.
      const batch = runBlocks(EMPTY_TALLY, BLOCKS_PER_STEP, random);
      setTally((t) => addTally(t, batch));
      left -= BLOCKS_PER_STEP;
      if (left > 0) setTimeout(step, 0);
      else setDealing(false);
    };
    step();
  }

  // Stop dealing if the lesson page closes mid-run.
  useEffect(() => () => void run.current++, []);

  function reset() {
    run.current++;
    setDealing(false);
    setTally(EMPTY_TALLY);
  }

  return (
    <figure className="diagram streak">
      <div className="streak-actions">
        <button type="button" className="button primary" onClick={deal} disabled={dealing}>
          {dealing ? t("streak.dealing") : t("streak.deal")}
        </button>
        {tally.blocks > 0 && (
          <button type="button" className="button quiet" onClick={reset}>
            {t("streak.reset")}
          </button>
        )}
      </div>
      <p className="streak-count" role="status">
        {tally.blocks === 0
          ? t("streak.none")
          : t("streak.count", { hands: tally.hands.toLocaleString("en-US"), streaks: tally.afterStreak.toLocaleString("en-US") })}
      </p>
      <RateBar label={t("streak.after")} hits={tally.premiumAfterStreak} trials={tally.afterStreak} />
      <RateBar label={t("streak.all")} hits={tally.premiumAll} trials={tally.hands} />
      <div className="rate-axis" aria-hidden="true">
        <span>0%</span>
        <span>2%</span>
        <span>4%</span>
        <span>6%</span>
      </div>
      <figcaption>
        {t("streak.caption", { expectedKey: <span key="e" className="key expected" />, ciKey: <span key="c" className="key ci" /> })}
      </figcaption>
    </figure>
  );
}
