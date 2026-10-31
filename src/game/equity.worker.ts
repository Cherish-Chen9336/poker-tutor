// Runs win-odds estimates off the main thread so the page stays responsive.
// Each request carries an id; a newer request makes older ones stop early.
import { estimateEquity, type Equity } from "./equity";

export interface EquityJob {
  id: number;
  hole: string[];
  board: string[];
  opponents: number;
}

export interface EquityReply {
  id: number;
  opponents: number;
  equity: Equity;
  final: boolean;
}

/** Web Crypto random numbers in [0, 1). */
function secure(): () => number {
  const buffer = new Uint32Array(1024);
  let i = buffer.length;
  return () => {
    if (i === buffer.length) {
      crypto.getRandomValues(buffer);
      i = 0;
    }
    return buffer[i++] / 4294967296;
  };
}

let latest = 0;
const random = secure();

// A quick first estimate (about ±2 points), then a better one (about ±1).
const STAGES = [2_500, 10_000];

self.onmessage = (event: MessageEvent<EquityJob>) => {
  const job = event.data;
  latest = Math.max(latest, job.id);
  let stage = 0;
  const step = () => {
    if (job.id < latest) return; // a newer situation replaced this one
    const equity = estimateEquity(job.hole, job.board, job.opponents, STAGES[stage], random);
    const final = equity.exact || stage === STAGES.length - 1;
    self.postMessage({ id: job.id, opponents: job.opponents, equity, final } satisfies EquityReply);
    stage++;
    if (!final) setTimeout(step, 0); // let newer messages in before the longer run
  };
  setTimeout(step, 0);
};
