// Words for the coach's facts in each language (translation pilot). The game
// code (src/game/coach.ts) stays free of wording choices for these lines.
import type { IntlShape } from "react-intl";
import type { CoachFact, CoachLine } from "../game/coach";
import { usePage } from "./hooks";
import { en, type MessageId } from "./messages/en";

/** Phrases a fact with one language's messages. */
export function phraseFact(intl: IntlShape, fact: CoachFact): string {
  const t = (id: MessageId, values?: Record<string, string | number>) => intl.formatMessage({ id, defaultMessage: en[id] }, values);
  // Two names use the language's own "and" (Japanese と); longer lists use the standard list format.
  const join = (names: string[]) =>
    names.length === 2 ? t("coach.and", { a: names[0], b: names[1] }) : intl.formatList(names, { type: "conjunction" });
  const later =
    fact.count === 1
      ? t("coach.position.only")
      : fact.rank === fact.count
        ? t("coach.position.last")
        : fact.rank === 1
          ? t("coach.position.first", { count: fact.count })
          : t("coach.position.middle", {
              rank: fact.rank,
              count: fact.count,
              before: join(fact.before.map((short) => t("coach.seatRef", { short }))),
            });
  return t("coach.position.preflop", { seat: t(`seat.${fact.position}` as MessageId), short: fact.position, later });
}

/** A coach line in the page's language: phrased from its fact when there is one, otherwise the English text. */
export function useCoachLine() {
  // The reader's language, even though the Play screen around it is still English.
  const { locale, intl } = usePage();
  return (line: CoachLine): { text: string; lang: string } =>
    line.fact && locale !== "en" && intl ? { text: phraseFact(intl, line.fact), lang: locale } : { text: line.text, lang: "en" };
}
