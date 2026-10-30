import { describe, expect, it } from "vitest";
import { loadProgress, markCompleted, saveProgress } from "./progress";

/** A Map-backed stand-in for localStorage. `fail` makes every call throw. */
function memoryStorage(fail = false): Storage {
  const data = new Map<string, string>();
  const guard = () => {
    if (fail) throw new DOMException("Storage is blocked", "SecurityError");
  };
  return {
    get length() { return data.size; },
    clear: () => { guard(); data.clear(); },
    getItem: (key) => { guard(); return data.get(key) ?? null; },
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (key) => { guard(); data.delete(key); },
    setItem: (key, value) => { guard(); data.set(key, value); },
  };
}

describe("progress storage", () => {
  it("saves and loads finished lessons", () => {
    const storage = memoryStorage();
    expect(saveProgress(storage, { completed: [1, 3] })).toBe(true);
    expect(loadProgress(storage)).toEqual({ completed: [1, 3] });
  });

  it("starts empty with no storage, nothing saved, or blocked storage", () => {
    expect(loadProgress(null)).toEqual({ completed: [] });
    expect(loadProgress(memoryStorage())).toEqual({ completed: [] });
    expect(loadProgress(memoryStorage(true))).toEqual({ completed: [] });
  });

  it("reports a failed save instead of throwing", () => {
    expect(saveProgress(null, { completed: [1] })).toBe(false);
    expect(saveProgress(memoryStorage(true), { completed: [1] })).toBe(false);
  });

  it("ignores corrupt or old-format data", () => {
    const storage = memoryStorage();
    for (const raw of ["{not json", "null", "[1,2]", '{"completed":[1]}', '{"version":2,"completed":[1]}', '{"version":1,"completed":"1"}']) {
      storage.setItem("poker-tutor:progress", raw);
      expect(loadProgress(storage), raw).toEqual({ completed: [] });
    }
  });

  it("keeps only valid lesson ids, sorted and without duplicates", () => {
    const storage = memoryStorage();
    storage.setItem("poker-tutor:progress", '{"version":1,"completed":[3,1,3,0,-2,1.5,"4",2]}');
    expect(loadProgress(storage)).toEqual({ completed: [1, 2, 3] });
  });

  it("marks a lesson finished once", () => {
    const once = markCompleted({ completed: [2] }, 1);
    expect(once).toEqual({ completed: [1, 2] });
    expect(markCompleted(once, 1)).toBe(once);
  });
});
