// Damaged saved hands: whatever is in browser storage, the Review screen must
// either reject a record or show it without crashing. Real records are damaged
// at random (wrong types, out-of-range numbers, odd strings) and every one that
// passes the checks is run through everything Review shows.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isHandRecord } from "../app/hand-store";
import { practiceBot } from "../game/bot";
import { handLog, resultLine } from "../game/hand-log";
import { Match, type HandRecord } from "../game/match";
import { reviewHand } from "../game/review";
import { CardText } from "../learn/cards";
import { TableFelt } from "../ui/TableFelt";

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ODD_VALUES: unknown[] = [null, undefined, 99, -1, 0.5, NaN, "x", "{xx}", "{2s}{xx}", "", true, "false", {}, [], [null], ["XX"], { min: "1" }];

/** Every path to a leaf value in a JSON-like object. */
function paths(value: unknown, prefix: (string | number)[] = []): (string | number)[][] {
  if (typeof value !== "object" || value === null) return [prefix];
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v] as const) : Object.entries(value);
  return [prefix, ...entries.flatMap(([k, v]) => paths(v, [...prefix, k]))];
}

function setAt(root: unknown, path: (string | number)[], newValue: unknown): unknown {
  if (path.length === 0) return newValue;
  const copy = JSON.parse(JSON.stringify(root));
  let node = copy;
  for (const key of path.slice(0, -1)) node = node[key];
  node[path.at(-1)!] = newValue;
  return copy;
}

/** Everything the Review screen computes and draws for a record. */
function showInReview(record: HandRecord) {
  reviewHand(record);
  const lines = handLog(record);
  renderToStaticMarkup(<>{lines.map((l, i) => <CardText key={i} text={l} />)}</>);
  renderToStaticMarkup(<CardText text={resultLine(record.final!, record.net!)} />);
  for (const view of [...record.moves.map((m) => m.view), record.final!]) renderToStaticMarkup(<TableFelt view={view} youSeat={0} />);
}

describe("damaged saved hands", () => {
  it("are either rejected or shown without crashing", () => {
    const random = seeded(5);
    const match = new Match({ bot: practiceBot, random: seeded(1), botRandom: seeded(2) });
    const records: HandRecord[] = [];
    for (let n = 0; n < 12; n++) {
      match.dealNext();
      while (!match.handOver) {
        const legal = match.legalMoves()!;
        match.act(legal.check ? { type: "check" } : random() < 0.3 ? { type: "fold" } : { type: "call" });
      }
      records.push(JSON.parse(JSON.stringify({ ...match.current!, id: `r${n}`, playedAt: "2026-10-31T00:00:00Z" })));
    }
    for (const record of records) {
      expect(isHandRecord(record)).toBe(true);
      showInReview(record);
    }
    let accepted = 0;
    let tried = 0;
    for (const record of records) {
      const all = paths(record).filter((p) => p.length > 0);
      for (let k = 0; k < 120; k++) {
        const path = all[Math.floor(random() * all.length)];
        const odd = ODD_VALUES[Math.floor(random() * ODD_VALUES.length)];
        const damaged = JSON.parse(JSON.stringify(setAt(record, path, odd) ?? null));
        tried++;
        if (!isHandRecord(damaged)) continue;
        accepted++;
        expect(() => showInReview(damaged), `${path.join(".")} = ${JSON.stringify(odd)}`).not.toThrow();
      }
    }
    expect(tried).toBe(1440);
    console.info(`damaged records accepted (and shown safely): ${accepted} of ${tried}`);
  });
});
