// Interactive pieces for lessons 9 and 10: a pot-odds calculator and the
// gambler's fallacy simulation.
import { useId, useRef, useState } from "react";
import { oneCardOdds } from "../game/hands";
import { LESSON9_EXAMPLE } from "./diagram-data";
import { EMPTY_TALLY, interval95, PREMIUM_CHANCE, runBlocks, secureRandom, type StreakTally } from "../game/simulate";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** A pie with one slice for `part` out of `whole`, starting at 12 o'clock. */
function Pie({ part, whole, label }: { part: number; whole: number; label: string }) {
  const share = whole > 0 ? part / whole : 0;
  const angle = share * 2 * Math.PI;
  const r = 60;
  const x = 70 + r * Math.sin(angle);
  const y = 70 - r * Math.cos(angle);
  const large = share > 0.5 ? 1 : 0;
  return (
    <svg viewBox="0 0 140 140" className="pie" role="img" aria-label={label}>
      <circle cx="70" cy="70" r={r} className="pie-pot" />
      {share >= 1 ? (
        <circle cx="70" cy="70" r={r} className="pie-call" />
      ) : share > 0 ? (
        <path d={`M70 70 L70 ${70 - r} A${r} ${r} 0 ${large} 1 ${x} ${y} Z`} className="pie-call" />
      ) : null}
    </svg>
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
        <Pie part={call} whole={pot + call} label={`Your call is ${pct(breakEven)} of the total you could win.`} />
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
          <dd className={valid ? (ev >= 0 ? "good" : "bad") : ""}>
            {valid ? `${ev >= 0 ? "+" : "−"}${Math.abs(ev).toFixed(1)} chips per call → ${ev >= 0 ? "call" : "fold"}` : "—"}
          </dd>
        </dl>
      </div>
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
          Likely range (95%): {pct(low, 1)} to {high > SCALE ? `${pct(high, 1)} (beyond this chart)` : pct(high, 1)}
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
      if (run.current !== id) return; // "Start over" was pressed
      setTally((t) => runBlocks(t, BLOCKS_PER_STEP, random));
      left -= BLOCKS_PER_STEP;
      if (left > 0) setTimeout(step, 0);
      else setDealing(false);
    };
    step();
  }

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
        <span className="key expected" /> the true chance, 2.56% (34 of 1,326 starting hands).{" "}
        <span className="key ci" /> the margin of error: where the true rate most likely lies, given the hands dealt so
        far. Each hand is a fresh shuffle from the browser's secure random source.
      </figcaption>
    </figure>
  );
}
