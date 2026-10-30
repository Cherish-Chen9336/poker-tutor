// Lesson progress, saved in the browser. Saving can fail (private windows,
// blocked storage); the app then keeps progress in memory for this visit.
import { useCallback, useState } from "react";

const KEY = "poker-tutor:progress";
const VERSION = 1;

export interface Progress {
  /** Ids of finished lessons, in ascending order. */
  completed: number[];
}

const EMPTY: Progress = { completed: [] };

/** Reads saved progress. Missing, unreadable, or old-format data counts as no progress. */
export function loadProgress(storage: Storage | null): Progress {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return EMPTY;
    const { version, completed } = data as { version?: unknown; completed?: unknown };
    if (version !== VERSION || !Array.isArray(completed)) return EMPTY;
    const ids = completed.filter((id): id is number => Number.isInteger(id) && id > 0);
    return { completed: [...new Set(ids)].sort((a, b) => a - b) };
  } catch {
    return EMPTY;
  }
}

/** Saves progress. Returns false if the browser refused. */
export function saveProgress(storage: Storage | null, progress: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify({ version: VERSION, completed: progress.completed }));
    return true;
  } catch {
    return false;
  }
}

export function markCompleted(progress: Progress, lessonId: number): Progress {
  if (progress.completed.includes(lessonId)) return progress;
  return { completed: [...progress.completed, lessonId].sort((a, b) => a - b) };
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useProgress() {
  const [progress, setProgress] = useState(() => loadProgress(browserStorage()));
  const [saved, setSaved] = useState(true);

  const update = useCallback((next: Progress) => {
    setProgress(next);
    setSaved(saveProgress(browserStorage(), next));
  }, []);

  const complete = useCallback((lessonId: number) => update(markCompleted(progress, lessonId)), [progress, update]);
  const reset = useCallback(() => update(EMPTY), [update]);

  return { progress, saved, complete, reset };
}
