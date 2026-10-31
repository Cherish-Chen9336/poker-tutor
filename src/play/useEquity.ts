// Asks the background worker for win-odds estimates and keeps only the
// answers for the current situation (older ones are ignored).
import { useEffect, useState } from "react";
import type { Equity, EquityRequest } from "../game/equity";
import type { EquityJob, EquityReply } from "../game/equity.worker";

let worker: Worker | null = null;
let nextId = 0;
const listeners = new Set<(reply: EquityReply) => void>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("../game/equity.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<EquityReply>) => listeners.forEach((listener) => listener(event.data));
  }
  return worker;
}

export interface EquityState {
  request: EquityRequest;
  equity: Equity | null;
}

/** Estimates for `requests` given the learner's cards and the board; null hole means no estimate wanted. */
export function useEquity(hole: string[] | null, board: string[], requests: EquityRequest[]): EquityState[] {
  const key = hole ? JSON.stringify([hole, board, requests.map((r) => r.opponents)]) : "";
  const [results, setResults] = useState<{ key: string; byOpponents: Record<number, Equity> }>({ key: "", byOpponents: {} });

  useEffect(() => {
    if (!key) return;
    const [jobHole, jobBoard, counts] = JSON.parse(key) as [string[], string[], number[]];
    const id = ++nextId;
    const listener = (reply: EquityReply) => {
      if (reply.id !== id) return; // an answer for an earlier situation
      setResults((r) => ({ key, byOpponents: { ...(r.key === key ? r.byOpponents : {}), [reply.opponents]: reply.equity } }));
    };
    listeners.add(listener);
    for (const opponents of counts) getWorker().postMessage({ id, hole: jobHole, board: jobBoard, opponents } satisfies EquityJob);
    return () => {
      listeners.delete(listener);
    };
  }, [key]);

  return requests.map((request) => ({ request, equity: results.key === key ? (results.byOpponents[request.opponents] ?? null) : null }));
}
