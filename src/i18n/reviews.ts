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
  { unit: "messages", locale: "zh-Hans", glossaryVersion: 2, source: "024c0b3356ea1a10", translation: "87e0986d81c2ce16", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, at 912465d)", date: "2026-11-02" },
  { unit: "messages", locale: "ja", glossaryVersion: 2, source: "024c0b3356ea1a10", translation: "f29bd10007d300d5", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, at 912465d)", date: "2026-11-02" },
  { unit: "lesson1", locale: "zh-Hans", glossaryVersion: 2, source: "d448be4b19f541a6", translation: "948d596827690ca4", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, at 912465d)", date: "2026-11-02" },
  { unit: "lesson1", locale: "ja", glossaryVersion: 2, source: "d448be4b19f541a6", translation: "33f47cc0bf662e65", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, at 912465d)", date: "2026-11-02" },
];
