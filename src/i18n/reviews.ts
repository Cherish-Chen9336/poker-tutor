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
  { unit: "messages", locale: "zh-Hans", glossaryVersion: 2, source: "024c0b3356ea1a10", translation: "8952e07769d1ade6", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, simplified after owner feedback, verified on the working tree after 1435d88)", date: "2026-11-02" },
  { unit: "messages", locale: "ja", glossaryVersion: 2, source: "024c0b3356ea1a10", translation: "6743386b77e58e59", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, simplified after owner feedback, verified on the working tree after 8e2b19f)", date: "2026-11-02" },
  { unit: "lesson1", locale: "zh-Hans", glossaryVersion: 2, source: "d448be4b19f541a6", translation: "0257a035689efb5e", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, simplified after owner feedback, verified on the working tree after 1435d88)", date: "2026-11-02" },
  { unit: "lesson1", locale: "ja", glossaryVersion: 2, source: "d448be4b19f541a6", translation: "54bae6d2879116bf", status: "passed", checkedBy: "Codex (thread 01a19200-e08d-7f61-a533-e99bcd483ab0, simplified after owner feedback, verified on the working tree after 8e2b19f)", date: "2026-11-02" },
];
