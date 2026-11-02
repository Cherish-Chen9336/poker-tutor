// Messages under the Play controls, kept as facts so they're worded in whatever language is shown now.
import type { useT } from "../i18n/hooks";
import type { Locale } from "../i18n/locales";

/** A message under the controls: a hand too long to save, or a move the table refused (with the engine's English reason). */
export type Notice = { kind: "tooLong" } | { kind: "rejected"; reason: string };

/** A notice's words in the language shown now. The engine's reasons are English; other languages get a general note. */
export function noticeText(notice: Notice, locale: Locale, t: ReturnType<typeof useT>): string {
  if (notice.kind === "tooLong") return t("play.tooLong");
  return locale === "en" ? notice.reason : t("play.rejected");
}
