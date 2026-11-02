// Review records for translations. Each record fingerprints the English it was
// checked against and the translation it checked. If either changes, the
// record no longer matches and the translation-review test fails: re-translate
// or re-check, then record the new fingerprints (the test prints them).
import type { Locale } from "./locales";

export interface ReviewRecord {
  unit: string;
  locale: Exclude<Locale, "en">;
  glossaryVersion: number;
  /** Fingerprints of the English source and of the translation, as checked. */
  source: string;
  translation: string;
  /** "pending" until Codex's cross-check (and verification of its fixes) passes. */
  status: "pending" | "passed";
  checkedBy?: string;
  date?: string;
}

export const REVIEWS: ReviewRecord[] = [
  { unit: "messages", locale: "zh-Hans", glossaryVersion: 3, source: "5327e6ce7af9a402", translation: "6d316d79b8679cc5", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "messages", locale: "ja", glossaryVersion: 3, source: "5327e6ce7af9a402", translation: "29932b884505d137", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson1", locale: "zh-Hans", glossaryVersion: 3, source: "08503b07ff0d9bd2", translation: "dc3247e5269caeaa", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson1", locale: "ja", glossaryVersion: 3, source: "08503b07ff0d9bd2", translation: "61195a2945fb3f53", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson2", locale: "zh-Hans", glossaryVersion: 3, source: "bea7067dc9469018", translation: "80c1c9f12528870e", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson2", locale: "ja", glossaryVersion: 3, source: "bea7067dc9469018", translation: "1d8150403354006f", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson3", locale: "zh-Hans", glossaryVersion: 3, source: "7144da4fe2418c70", translation: "fca2d8904cb8856b", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson3", locale: "ja", glossaryVersion: 3, source: "7144da4fe2418c70", translation: "3539be9979488543", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson4", locale: "zh-Hans", glossaryVersion: 3, source: "a50a55cc3b0737bb", translation: "50baab8f7fb14257", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson4", locale: "ja", glossaryVersion: 3, source: "a50a55cc3b0737bb", translation: "6a0f5deeb4e26e3f", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson5", locale: "zh-Hans", glossaryVersion: 3, source: "5309702fc0ad9ecd", translation: "7501aa91c3c95658", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson5", locale: "ja", glossaryVersion: 3, source: "5309702fc0ad9ecd", translation: "04105374042e2559", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson6", locale: "zh-Hans", glossaryVersion: 3, source: "6d5c97eb4333f223", translation: "6516d9b9e7e02082", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson6", locale: "ja", glossaryVersion: 3, source: "6d5c97eb4333f223", translation: "2b1920a1dd46b69d", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson7", locale: "zh-Hans", glossaryVersion: 3, source: "e61c0552c7c351d9", translation: "1e5d6937d8612fd6", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
  { unit: "lesson7", locale: "ja", glossaryVersion: 3, source: "e61c0552c7c351d9", translation: "590b60e12dd6465e", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, batch 1: lessons 2–7, verified on the working tree after 145256e)", date: "2026-11-02" },
];
