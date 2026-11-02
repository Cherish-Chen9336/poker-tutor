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
  { unit: "messages", locale: "zh-Hans", glossaryVersion: 2, source: "", translation: "", status: "pending" },
  { unit: "messages", locale: "ja", glossaryVersion: 2, source: "", translation: "", status: "pending" },
  { unit: "lesson1", locale: "zh-Hans", glossaryVersion: 2, source: "", translation: "", status: "pending" },
  { unit: "lesson1", locale: "ja", glossaryVersion: 2, source: "", translation: "", status: "pending" },
];
