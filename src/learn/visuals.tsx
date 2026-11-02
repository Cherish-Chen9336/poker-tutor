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
  const t = useT();
  const call = 20;
  const pots = [
    { pot: 40, earlier: 10 },
    { pot: 180, earlier: 60 },
  ];
  const max = Math.max(...pots.map((p) => p.pot)) + call; // the widest bar: the bigger pot plus the call
  return (
    <figure className="diagram">
      <p className="visual-setup">{t("potCompare.setup", { call })}</p>
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
                {t("potCompare.row", {
                  pot,
                  call,
                  eq: Number.isInteger(need * 100) ? "=" : "≈",
                  need: pct(need, Number.isInteger(need * 100) ? 0 : 1),
                  earlier,
                })}
              </p>
            </li>
          );
        })}
      </ul>
      <figcaption>
        {t("potCompare.caption", {
          mineKey: <span key="m" className="key mine" />,
          potKey: <span key="p" className="key pot" />,
          callKey: <span key="c" className="key call" />,
        })}
      </figcaption>
    </figure>
  );
}

/** Lesson 13: decision quality against result, on Lesson 9's example. */
export function ResultGrid() {
  const t = useT();
  const { you, opponent, board } = LESSON9_EXAMPLE;
  const { winCards, unseen } = LESSON13_CALLS;
  const win = winCards / unseen;
  return (
    <figure className="diagram">
      <p className="visual-setup">
        {t("grid.setup", {
          y1: <C key="y1" c={you[0]} />,
          y2: <C key="y2" c={you[1]} />,
          o1: <C key="o1" c={opponent[0]} />,
          o2: <C key="o2" c={opponent[1]} />,
          board: board.map((c) => <C key={c} c={c} />),
          winCards,
          unseen,
          win: pct(win),
        })}
      </p>
      <div className="table-wrap">
        <table className="result-grid">
          <thead>
            <tr>
              <td />
              <th scope="col">{t("grid.heart")}</th>
              <th scope="col">{t("grid.noHeart")}</th>
            </tr>
          </thead>
          <tbody>
            {LESSON13_CALLS.calls.map((c) => {
              const good = win > breakEven(c.pot, c.call);
              const kind = good ? t("grid.good") : t("grid.bad");
              return (
                <tr key={c.pot} className={good ? "good" : "bad"}>
                  <th scope="row">
                    <b>{kind}</b>
                    <span>{t("grid.row", { pot: c.pot, call: c.call, need: pct(breakEven(c.pot, c.call)) })}</span>
                  </th>
                  <td>
                    <b className="mono">+{c.pot}</b> {t("grid.winning", { kind })}
                  </td>
                  <td>
                    <b className="mono">−{c.call}</b> {t("grid.losing", { kind })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <figcaption>{t("grid.caption", { win: pct(win), lose: pct(1 - win) })}</figcaption>
    </figure>
  );
}

/** Lesson 14: the bankroll after 55 wins and 45 losses, at three fractions. */
export function KellyBars() {
  const t = useT();
  const rows = [
    { label: t("kelly.half"), f: 0.05 },
    { label: t("kelly.full"), f: 0.1 },
    { label: t("kelly.twice"), f: 0.2 },
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
      <p className="kelly-chain mono">{t("kelly.chain")}</p>
      <figcaption>{t("kelly.caption", { startKey: <span key="s" className="key start" /> })}</figcaption>
    </figure>
  );
}

/** Lesson 10: what the demo counts as one case. */
export function StreakStrip() {
  const t = useT();
  const steps = [t("strip.lost", { n: 1 }), t("strip.lost", { n: 2 }), t("strip.lost", { n: 3 }), t("strip.check")];
  return (
    <figure className="diagram">
      <ol className="streak-strip">
        {steps.map((step, i) => (
          <li key={i} className={i === steps.length - 1 ? "check" : ""}>
            {step}
          </li>
        ))}
      </ol>
      <figcaption>{t("strip.caption")}</figcaption>
    </figure>
  );
}

/** Lesson 11: the balance point as six equally likely cases. */
export function BluffTokens() {
  const t = useT();
  const best = [t("tokens.best"), t("tokens.best"), t("tokens.best")];
  return (
    <figure className="diagram">
      <ul className="bluff-tokens">
        {best.map((t, i) => (
          <li key={i} className="token bet">
            {t}
          </li>
        ))}
        <li className="token bet bluff">{t("tokens.bluff")}</li>
        <li className="token">{t("tokens.check")}</li>
        <li className="token">{t("tokens.check")}</li>
      </ul>
      <div className="bluff-brackets">
        <p className="bracket bets">{t("tokens.bets")}</p>
        <p className="bracket nothing">{t("tokens.nothing")}</p>
      </div>
      <figcaption>{t("tokens.caption")}</figcaption>
    </figure>
  );
}

/** Lesson 11's toy game as a small decision tree, with your result at each end. */
export function BluffTree() {
  const t = useT();
  const leaf = (label: string, result: string, tone: "win" | "lose" | "zero") => (
    <li className={`leaf ${tone}`}>
      <span>{label}</span>
      <b>{result}</b>
    </li>
  );
  return (
    <figure className="diagram">
      <div className="tree">
        <div className="branch">
          <p className="node">{t("tree.best")}</p>
          <p className="node sub">{t("tree.bet")}</p>
          <ul>
            {leaf(t("tree.calls"), t("tree.win150"), "win")}
            {leaf(t("tree.folds"), t("tree.win100"), "win")}
          </ul>
        </div>
        <div className="branch">
          <p className="node">{t("tree.nothing")}</p>
          <p className="node sub">{t("tree.checkOrBluff")}</p>
          <ul>
            {leaf(t("tree.check"), t("tree.zero"), "zero")}
            {leaf(t("tree.bluffCalled"), t("tree.lose50"), "lose")}
            {leaf(t("tree.bluffFolds"), t("tree.win100"), "win")}
          </ul>
        </div>
      </div>
      <figcaption>{t("tree.caption")}</figcaption>
    </figure>
  );
}
