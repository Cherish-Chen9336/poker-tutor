// Step 1b visuals (lessons 5, 12, 13, 14, 16). Each is plain HTML (lists, a
// table, bars with visible labels), so screen readers read the same facts the
// picture shows. Numbers come from the formulas in diagram-data.ts.
import { useT } from "../i18n/hooks";
import type { MessageId } from "../i18n/messages/en";
import { C } from "./cards";
import { breakEven, kellyBalance, LESSON9_EXAMPLE, LESSON13_CALLS } from "./diagram-data";

const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** Lesson 5: what you can do, by situation. */
export function SituationCards() {
  const t = useT();
  const cards: { when: MessageId; moves: [MessageId, MessageId?][]; note?: MessageId }[] = [
    { when: "situations.none", moves: [["situations.check", "situations.checkWhat"], ["situations.bet", "situations.betWhat"]] },
    { when: "situations.bb", moves: [["situations.check"], ["situations.raise"]], note: "situations.bbNote" },
    { when: "situations.facing", moves: [["situations.fold"], ["situations.call", "situations.callWhat"], ["situations.raiseTo"]] },
  ];
  return (
    <figure className="diagram">
      <ul className="situations">
        {cards.map((c) => (
          <li key={c.when} className="situation">
            <p className="situation-when">{t(c.when)}</p>
            <ul className="situation-moves">
              {c.moves.map(([move, what]) => (
                <li key={move}>
                  <b>{t(move)}</b>
                  {what && <span className="situation-what">{t("situations.what", { what: t(what) })}</span>}
                </li>
              ))}
            </ul>
            {c.note && <p className="situation-note">{t(c.note)}</p>}
          </li>
        ))}
      </ul>
      <figcaption>{t("situations.caption")}</figcaption>
    </figure>
  );
}

/** Lesson 12: the same call in a small pot and a big one. */
export function PotCompare() {
  const call = 20;
  const pots = [
    { pot: 40, earlier: 10 },
    { pot: 180, earlier: 60 },
  ];
  const max = Math.max(...pots.map((p) => p.pot)) + call; // the widest bar: the bigger pot plus the call
  return (
    <figure className="diagram">
      <p className="visual-setup">Heads-up. Each pot includes the opponent's bet, and calling {call} ends the betting.</p>
      <ul className="pot-compare">
        {pots.map(({ pot, earlier }) => {
          const need = breakEven(pot, call);
          return (
            <li key={pot}>
              <div className="pot-bar" aria-hidden="true">
                <span className="pot-mine" style={{ width: `${(earlier / max) * 100}%` }} />
                <span className="pot-rest" style={{ width: `${((pot - earlier) / max) * 100}%` }} />
                <span className="pot-call" style={{ width: `${(call / max) * 100}%` }} />
              </div>
              <p>
                <b>Pot {pot}</b>, call {call}: you need {call} ÷ ({pot} + {call}) {Number.isInteger(need * 100) ? "=" : "≈"}{" "}
                <b>{pct(need, Number.isInteger(need * 100) ? 0 : 1)}</b>. {earlier} of the pot came from you earlier.
              </p>
            </li>
          );
        })}
      </ul>
      <figcaption>
        <span className="key mine" /> yours earlier, now the pot's <span className="key pot" /> the rest of the pot{" "}
        <span className="key call" /> your call. Pot size and call price set the chance you need. Who put the chips in
        doesn't.
      </figcaption>
    </figure>
  );
}

/** Lesson 13: decision quality against result, on Lesson 9's example. */
export function ResultGrid() {
  const { you, opponent, board } = LESSON9_EXAMPLE;
  const { winCards, unseen } = LESSON13_CALLS;
  const win = winCards / unseen;
  return (
    <figure className="diagram">
      <p className="visual-setup">
        You hold <C c={you[0]} /> <C c={you[1]} />, your opponent <C c={opponent[0]} /> <C c={opponent[1]} />. Board:{" "}
        {board.map((c) => (
          <C key={c} c={c} />
        ))}
        . One card to come, and your call ends the betting. For this example, both hands are known before the call. You win
        only if a heart comes ({winCards} of the {unseen} unseen cards, {pct(win)}).
      </p>
      <div className="table-wrap">
        <table className="result-grid">
          <thead>
            <tr>
              <td />
              <th scope="col">A heart comes (you win)</th>
              <th scope="col">No heart (you lose)</th>
            </tr>
          </thead>
          <tbody>
            {LESSON13_CALLS.calls.map((c) => {
              const good = win > breakEven(c.pot, c.call);
              const kind = good ? "Good call" : "Bad call";
              return (
                <tr key={c.pot} className={good ? "good" : "bad"}>
                  <th scope="row">
                    <b>{kind}</b>
                    <span>
                      pot {c.pot}, call {c.call}: you need {pct(breakEven(c.pot, c.call))}
                    </span>
                  </th>
                  <td>
                    <b className="mono">+{c.pot}</b> {kind}, winning result.
                  </td>
                  <td>
                    <b className="mono">−{c.call}</b> {kind}, losing result.
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <figcaption>
        Amounts are chips won or lost by calling. Either call wins {pct(win)} of the time and loses {pct(1 - win)}; the
        boxes' size doesn't show the chances.
      </figcaption>
    </figure>
  );
}

/** Lesson 14: the bankroll after 55 wins and 45 losses, at three fractions. */
export function KellyBars() {
  const rows = [
    { label: "Half Kelly (5%)", f: 0.05 },
    { label: "Kelly (10%)", f: 0.1 },
    { label: "Twice Kelly (20%)", f: 0.2 },
  ].map((r) => ({ ...r, end: Math.round(kellyBalance(r.f)) }));
  const scale = 180;
  return (
    <figure className="diagram">
      <ul className="kelly-bars">
        {rows.map((r) => (
          <li key={r.f}>
            <span className="kelly-label">{r.label}</span>
            <span className="kelly-track" aria-hidden="true">
              <span className={`kelly-fill ${r.end < 100 ? "down" : ""}`} style={{ width: `${(r.end / scale) * 100}%` }} />
              <span className="kelly-start" style={{ left: `${(100 / scale) * 100}%` }} />
            </span>
            <span className="kelly-end mono">
              100 → <b>{r.end}</b>
            </span>
          </li>
        ))}
      </ul>
      <p className="kelly-chain mono">100 → lose 20% → 80 → win 20% → 96</p>
      <figcaption>
        <span className="key start" /> the starting 100. Rounded balances after 55 wins and 45 losses, starting from 100.
        Real results vary.
      </figcaption>
    </figure>
  );
}

/** Lesson 10: what the demo counts as one case. */
export function StreakStrip() {
  const steps = ["Hand 1: lost", "Hand 2: lost", "Hand 3: lost", "Hand 4: premium?"];
  return (
    <figure className="diagram">
      <ol className="streak-strip">
        {steps.map((step, i) => (
          <li key={step} className={i === steps.length - 1 ? "check" : ""}>
            {step}
          </li>
        ))}
      </ol>
      <figcaption>Hands are dealt in separate groups of 4, so every case is independent. A tie breaks the streak.</figcaption>
    </figure>
  );
}

/** Lesson 11: the balance point as six equally likely cases. */
export function BluffTokens() {
  const best = ["Best hand: bet", "Best hand: bet", "Best hand: bet"];
  return (
    <figure className="diagram">
      <ul className="bluff-tokens">
        {best.map((t, i) => (
          <li key={i} className="token bet">
            {t}
          </li>
        ))}
        <li className="token bet bluff">Nothing: bluff</li>
        <li className="token">Nothing: check</li>
        <li className="token">Nothing: check</li>
      </ul>
      <div className="bluff-brackets">
        <p className="bracket bets">1 of the 4 bets is a bluff</p>
        <p className="bracket nothing">1 of the 3 "nothing" hands is a bluff</p>
      </div>
      <figcaption>Six equally likely cases, showing proportions, not six hands in a row.</figcaption>
    </figure>
  );
}
