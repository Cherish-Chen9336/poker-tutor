// Interactive pieces for lessons 9 and 10: a pot-odds calculator and the
// gambler's fallacy simulation.
import { useEffect, useId, useRef, useState } from "react";
import { oneCardOdds } from "../game/hands";
import { averageResult, LESSON9_EXAMPLE } from "./diagram-data";
import { addTally, EMPTY_TALLY, interval95, PREMIUM_CHANCE, runBlocks, secureRandom, type StreakTally } from "../game/simulate";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** The final pot split into the call and the pot, and the chance needed against the chance you have. */
function PriceBars({ pot, call, need, have }: { pot: number; call: number; need: number; have: number }) {
  return (
    <div className="price" aria-hidden="true">
      <div className="price-strip">
        <span className="seg-a" style={{ flexGrow: call }} />
        <span className="seg-b" style={{ flexGrow: pot }} />
      </div>
      <p className="price-note">Final pot: {pot + call}</p>
      {[
        ["You need", need],
        ["You have", have],
      ].map(([label, share]) => (
        <div key={label} className="price-row">
          <span>{label}</span>
          <span className="price-track">
            <span className={label === "You need" ? "price-need" : "price-have"} style={{ width: `${(share as number) * 100}%` }} />
          </span>
          <span className="mono">{pct(share as number)}</span>
        </div>
      ))}
    </div>
  );
}

export function PotOddsCalculator() {
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
    { label: "Case 1", pot: 100, call: 50 },
    { label: "Case 2", pot: 200, call: 25 },
  ];

  return (
    <figure className="diagram calc">
      <div className="seg-row">
        <div className="seg" role="group" aria-label="Examples">
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
          <label htmlFor={potId}>Pot, including the bet (P)</label>
          <input id={potId} type="number" min={1} step={1} inputMode="numeric" value={pot} onChange={(e) => setPot(Math.max(0, Math.round(Number(e.target.value))))} />
          <label htmlFor={callId}>Your call (C)</label>
          <input id={callId} type="number" min={1} step={1} inputMode="numeric" value={call} onChange={(e) => setCall(Math.max(0, Math.round(Number(e.target.value))))} />
        </div>
        <dl className="calc-out" aria-live="polite">
          <dt>Break-even chance</dt>
          <dd>{valid ? `${call} ÷ ${pot + call} = ${pct(breakEven)}` : "Enter a pot and a call"}</dd>
          <dt>Your chance (9 of 44 river cards)</dt>
          <dd>{pct(odds.equity)}</dd>
          <dt>Average result of calling</dt>
          <dd className={!valid || even ? "" : ev > 0 ? "good" : "bad"}>{valid ? averageResult(ev) : "—"}</dd>
        </dl>
      </div>
      {valid && <PriceBars pot={pot} call={call} need={breakEven} have={odds.equity} />}
      <figcaption>
        <span className="key call" /> your call (C) <span className="key pot" /> the pot (P). If your chance of winning is
        bigger than your call's share, calling earns more on average than folding.
      </figcaption>
    </figure>
  );
}

const SCALE = 0.06; // the bars show 0% to 6%

function RateBar({ label, hits, trials }: { label: string; hits: number; trials: number }) {
  const rate = trials ? hits / trials : 0;
  const [low, high] = interval95(hits, trials);
  const at = (x: number) => `${(Math.min(x, SCALE) / SCALE) * 100}%`;
  return (
    <div className="rate">
      <div className="rate-label">
        <b>{label}</b>
        <span className="mono">
          {trials ? `${hits.toLocaleString("en-US")} of ${trials.toLocaleString("en-US")} = ${pct(rate, 2)}` : "no cases yet"}
        </span>
      </div>
      <div className="rate-track" aria-hidden="true">
        {trials > 0 && <span className="rate-fill" style={{ width: at(rate) }} />}
        {trials > 0 && <span className="rate-ci" style={{ left: at(low), width: `calc(${at(high)} - ${at(low)})` }} />}
        <span className="rate-expected" style={{ left: at(PREMIUM_CHANCE) }} />
      </div>
      {trials > 0 && (
        <span className="rate-note">
          95% range: {pct(low, 1)} to {high > SCALE ? `${pct(high, 1)} (beyond this chart)` : pct(high, 1)}
        </span>
      )}
    </div>
  );
}

const BLOCKS_PER_CLICK = 10_000; // 40,000 hands
const BLOCKS_PER_STEP = 1_000; // dealt in small steps so the page stays responsive

export function StreakDemo() {
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
          {dealing ? "Dealing…" : "Deal 40,000 more hands"}
        </button>
        {tally.blocks > 0 && (
          <button type="button" className="button quiet" onClick={reset}>
            Start over
          </button>
        )}
      </div>
      <p className="streak-count" role="status">
        {tally.blocks === 0
          ? "No hands dealt yet."
          : `${tally.hands.toLocaleString("en-US")} hands dealt. Losing streaks of 3: ${tally.afterStreak.toLocaleString("en-US")}.`}
      </p>
      <RateBar label="Premium hand right after 3 losses in a row" hits={tally.premiumAfterStreak} trials={tally.afterStreak} />
      <RateBar label="Premium hand in all hands" hits={tally.premiumAll} trials={tally.hands} />
      <div className="rate-axis" aria-hidden="true">
        <span>0%</span>
        <span>2%</span>
        <span>4%</span>
        <span>6%</span>
      </div>
      <figcaption>
        <span className="key expected" /> the true chance, 2.56% (34 of the 1,326 two-card combinations).{" "}
        <span className="key ci" /> a 95% range for the underlying chance, given the hands dealt so far. If the dashed line
        falls inside it, the results fit ordinary random variation. (Even with a fair shuffle, about 1 run in 20 lands
        outside.) Each hand is a fresh shuffle from the browser's secure random source.
      </figcaption>
    </figure>
  );
}
